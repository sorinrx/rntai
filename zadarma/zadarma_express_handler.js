require('dotenv').config();
const axios = require('axios');
const { findEmployeeByPhoneNumber } = require('../app/utils/employeeData');
const getRecordingLink = require('../app/utils/getRecordingLink');
const cleanupRecordings = require('./cleanupRecordings');

let temporary_storage = {};

async function getBitrix24AccessToken() {
    const clientId = process.env.BITRIX24_CLIENT_ID;
    const clientSecret = process.env.BITRIX24_CLIENT_SECRET;
    const refreshToken = process.env.BITRIX24_REFRESH_TOKEN;
    const domain = process.env.BITRIX24_DOMAIN;

    try {
        const response = await axios.get(`https://${domain}/oauth/token/`, {
            params: {
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken
            }
        });

        process.env.BITRIX24_REFRESH_TOKEN = response.data.refresh_token;

        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Bitrix24 access token:', error.message);
        throw error;
    }
}

async function sendLeadToBitrix24(leadId, employee, callData) {
    const bitrix24WebhookUrl = process.env.BITRIX24_WEBHOOK_URL;

    if (!bitrix24WebhookUrl) {
        console.error('Bitrix24 webhook URL is not set in environment variables.');
        return;
    }

    console.log(`Processing call for Bitrix24. LeadId: ${leadId}, Employee: ${employee.name}`);
    console.log('Call data:', JSON.stringify(callData, null, 2));

    try {
        // Step 1: Create a new lead
        const leadData = {
            TITLE: `Incoming call from ${callData.from}`,
            NAME: callData.from,
            STATUS_ID: "NEW",
            ASSIGNED_BY_ID: employee.userId,
            PHONE: [{ VALUE: callData.from, VALUE_TYPE: "WORK" }]
        };

        const createLeadResponse = await axios.post(`${bitrix24WebhookUrl}crm.lead.add`, { fields: leadData });
        console.log('Lead creation response:', JSON.stringify(createLeadResponse.data, null, 2));

        const createdLeadId = createLeadResponse.data.result;

        // Step 2: Schedule the call processing after 10 seconds
        setTimeout(async () => {
            try {
                await processCallWithRecording(bitrix24WebhookUrl, employee, callData, createdLeadId);
            } catch (error) {
                console.error('Error in delayed call processing:', error.message);
            }
        }, 10000);

        return {
            createdLeadId: createdLeadId
        };
    } catch (error) {
        console.error('Error creating lead in Bitrix24:', error.message);
        if (error.response) {
            console.error('Bitrix24 error response:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

async function processCallWithRecording(bitrix24WebhookUrl, employee, callData, existingLeadId) {
    try {
        // Step 1: Register the call
        const registerData = {
            USER_ID: employee.userId,
            PHONE_NUMBER: callData.from,
            CALL_START_DATE: new Date(callData.call_start).toISOString(),
            CRM_CREATE: 0,
            SHOW: 0,
            TYPE: 2, // inbound call
            CRM_ENTITY_TYPE: 'LEAD',
            CRM_ENTITY_ID: existingLeadId
        };

        console.log('Call registration data:', JSON.stringify(registerData, null, 2));
        const registerResponse = await axios.post(`${bitrix24WebhookUrl}telephony.externalcall.register`, registerData);
        console.log('Call registration response:', JSON.stringify(registerResponse.data, null, 2));

        const callId = registerResponse.data.result.CALL_ID;

        // Step 2: Finish the call
        const finishData = {
            CALL_ID: callId,
            USER_ID: employee.userId,
            DURATION: parseInt(callData.duration),
            STATUS_CODE: callData.status_code,
            COST: 0,
            COST_CURRENCY: "USD",
            ADD_TO_CHAT: 1
        };

        console.log('Call finish data:', JSON.stringify(finishData, null, 2));
        const finishResponse = await axios.post(`${bitrix24WebhookUrl}telephony.externalcall.finish`, finishData);
        console.log('Call finish response:', JSON.stringify(finishResponse.data, null, 2));

        // Step 3: Attach the recording
        const recordingLink = await getRecordingLink(callData.pbx_call_id);
        
        if (recordingLink) {
            const attachData = {
                CALL_ID: callId,
                FILENAME: `call_recording_${callData.pbx_call_id}.mp3`,
                RECORD_URL: recordingLink
            };

            console.log('Recording attachment data:', JSON.stringify(attachData, null, 2));
            const attachResponse = await axios.post(`${bitrix24WebhookUrl}telephony.externalCall.attachRecord`, attachData);
            console.log('Recording attachment response:', JSON.stringify(attachResponse.data, null, 2));
        } else {
            console.warn('Recording link not available from Zadarma');
        }

        console.log(`Call processing completed for lead ID: ${existingLeadId}`);
    } catch (error) {
        console.error('Error processing call with recording:', error.message);
        if (error.response) {
            console.error('Bitrix24 error response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function updateLeadWithRecordingLink(webhookUrl, leadId, recordingLink, comments) {
    try {
        const updateData = {
            id: leadId,
            fields: {
                UF_CRM_CALL_RECORDING: recordingLink,
                COMMENTS: `${comments}\n\nRecording link: ${recordingLink}`
            }
        };
        
        const updateResponse = await axios.post(`${webhookUrl}crm.lead.update`, updateData);
        console.log('Bitrix24 Lead Update API response:', updateResponse.data);
    } catch (updateError) {
        console.error('Error updating lead with recording link:', updateError.message);
    }
}

function verify_data(data, signature) {
    console.log('Verifying data signature:', data, signature);
    return true;
}

const handlers = {
    'NOTIFY_START': function NOTIFY_START(data, signature) {
        if (!temporary_storage[data.pbx_call_id]) {
            console.log(`Initializing temporary storage for pbx_call_id: ${data.pbx_call_id}`);
            temporary_storage[data.pbx_call_id] = {
                event: [],
                pbx_call_id: data.pbx_call_id,
                from: data.caller_id,
                to: data.called_did,
                call_start: data.call_start
            };
        }

        temporary_storage[data.pbx_call_id].event.push(data.event);
        temporary_storage[data.pbx_call_id].verify = verify_data(`${data.caller_id}${data.called_did}${data.call_start}`, signature);

        console.log(`NOTIFY_START event handled for pbx_call_id: ${data.pbx_call_id}`);
        return temporary_storage[data.pbx_call_id];
    },
    'NOTIFY_END': function NOTIFY_END(data, signature) {
        if (!temporary_storage[data.pbx_call_id]) {
            console.log(`Initializing temporary storage for pbx_call_id: ${data.pbx_call_id}`);
            temporary_storage[data.pbx_call_id] = {
                event: [],
                pbx_call_id: data.pbx_call_id,
                from: data.caller_id,
                to: data.called_did,
            };
        }

        temporary_storage[data.pbx_call_id].event.push(data.event);
        Object.assign(
            temporary_storage[data.pbx_call_id],
            {
                duration: data.duration,
                disposition: data.disposition,
                status: data.disposition,
                status_code: data.status_code,
                is_recorded: data.is_recorded,
                verify: verify_data(`${data.caller_id}${data.called_did}${data.call_start}`, signature)
            }
        );

        const employee = findEmployeeByPhoneNumber(data.called_did);
        if (employee) {
            console.log(`Lead assigned to: ${employee.name}`);
            temporary_storage[data.pbx_call_id].assigned_to = employee.userId;
        } else {
            console.log('No employee found for the called number.');
        }

        return temporary_storage[data.pbx_call_id];
    },
    'NOTIFY_OUT_END': function NOTIFY_OUT_END(data, signature) {
        if (!temporary_storage[data.pbx_call_id]) {
            console.log(`Initializing temporary storage for pbx_call_id: ${data.pbx_call_id}`);
            temporary_storage[data.pbx_call_id] = {
                event: [],
                pbx_call_id: data.pbx_call_id,
                from: data.caller_id,
                to: data.destination,
            };
        }

        temporary_storage[data.pbx_call_id].event.push(data.event);
        Object.assign(
            temporary_storage[data.pbx_call_id],
            {
                duration: data.duration,
                disposition: data.disposition,
                status: data.disposition,
                status_code: data.status_code,
                is_recorded: data.is_recorded,
                verify: verify_data(`${data.caller_id}${data.destination}${data.call_start}`, signature)
            }
        );

        const employee = findEmployeeByPhoneNumber(data.caller_id);
        if (employee) {
            console.log(`Outgoing call made by: ${employee.name}`);
            temporary_storage[data.pbx_call_id].made_by = employee.userId;
        } else {
            console.log('No employee found for the caller number.');
        }

        return temporary_storage[data.pbx_call_id];
    },
    'NOTIFY_RECORD': async function NOTIFY_RECORD(data, signature) {
    if (!temporary_storage[data.pbx_call_id]) {
        console.log(`Initializing temporary storage for pbx_call_id: ${data.pbx_call_id}`);
        temporary_storage[data.pbx_call_id] = {
            event: [],
            pbx_call_id: data.pbx_call_id,
        };
    }

    temporary_storage[data.pbx_call_id].event.push(data.event);
    temporary_storage[data.pbx_call_id].call_id_with_rec = data.call_id_with_rec;

    const employee = findEmployeeByPhoneNumber(temporary_storage[data.pbx_call_id].to);

    if (employee) {
        console.log(`Attempting to process call for pbx_call_id: ${data.pbx_call_id}`);
        try {
            const result = await sendLeadToBitrix24(data.pbx_call_id, employee, temporary_storage[data.pbx_call_id]);
            console.log('Bitrix24 lead creation result:', result);
            if (result.createdLeadId) {
                console.log('New lead created with ID:', result.createdLeadId);
                console.log('Call processing with recording will start in 10 seconds.');
            } else {
                console.warn('Lead creation may have failed. Check the result:', result);
            }
        } catch (error) {
            console.error('Error processing NOTIFY_RECORD:', error.message);
        }
    } else {
        console.log('No employee found for the called number in NOTIFY_RECORD.');
    }

    return temporary_storage[data.pbx_call_id];
}
};

module.exports = {
    handlers,
    temporary_storage
};