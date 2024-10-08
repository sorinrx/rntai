const axios = require('axios');

async function cleanupRecordings(bitrix24WebhookUrl, phoneNumber, assignedUserId) {
    console.log(`Starting cleanup for phone number ${phoneNumber} and assignedUserId ${assignedUserId}`);
    try {
        const entities = await findEntitiesByPhoneNumber(bitrix24WebhookUrl, phoneNumber);
        console.log(`Found ${entities.length} total entities for phone number ${phoneNumber}`);

        // Exclude the entity that was just created/updated
        const entitiesToCheck = entities.filter(entity => entity.ASSIGNED_BY_ID != assignedUserId);
        console.log(`${entitiesToCheck.length} entities need checking for unwanted activities`);

        for (const entity of entitiesToCheck) {
            await deleteUnwantedActivities(bitrix24WebhookUrl, entity.ID, entity.ENTITY_TYPE, assignedUserId);
        }

        console.log(`Cleanup process completed for phone number ${phoneNumber}`);
    } catch (error) {
        console.error('Error in cleanupRecordings:', error.message);
    }
}

async function findEntitiesByPhoneNumber(webhookUrl, phoneNumber) {
    try {
        const leadResponse = await axios.post(`${webhookUrl}crm.lead.list`, {
            filter: { "PHONE": phoneNumber },
            select: ["ID", "TITLE", "ASSIGNED_BY_ID"]
        });
        const contactResponse = await axios.post(`${webhookUrl}crm.contact.list`, {
            filter: { "PHONE": phoneNumber },
            select: ["ID", "NAME", "LAST_NAME", "ASSIGNED_BY_ID"]
        });

        const leads = leadResponse.data.result.map(lead => ({...lead, ENTITY_TYPE: 'LEAD'}));
        const contacts = contactResponse.data.result.map(contact => ({...contact, ENTITY_TYPE: 'CONTACT'}));

        return [...leads, ...contacts];
    } catch (error) {
        console.error('Error finding entities:', error.message);
        return [];
    }
}

async function deleteUnwantedActivities(webhookUrl, entityId, entityType, assignedUserId) {
    try {
        const ownerTypeId = entityType === 'LEAD' ? 1 : 2; // 1 for Lead, 2 for Contact
        const activitiesResponse = await axios.post(`${webhookUrl}crm.activity.list`, {
            filter: { 
                "OWNER_ID": entityId, 
                "OWNER_TYPE_ID": ownerTypeId,
                "RESPONSIBLE_ID": assignedUserId,
                ">CREATED": new Date(Date.now() - 5 * 60 * 1000).toISOString() // activities created in the last 5 minutes
            }
        });

        const allActivities = activitiesResponse.data.result;
        console.log(`Found ${allActivities.length} recent activities for ${entityType} ${entityId}`);

        const unwantedActivities = allActivities.filter(
            activity => activity.TYPE_ID === 2 // 2 is the TYPE_ID for call activities
        );

        console.log(`Found ${unwantedActivities.length} unwanted call activities for ${entityType} ${entityId}`);

        for (const activity of unwantedActivities) {
            try {
                await axios.post(`${webhookUrl}crm.activity.delete`, {
                    id: activity.ID
                });
                console.log(`Deleted activity ${activity.ID} from ${entityType} ${entityId}`);
            } catch (deleteError) {
                console.error(`Error deleting activity ${activity.ID}:`, deleteError.message);
            }
        }
    } catch (error) {
        console.error(`Error handling activities for ${entityType} ${entityId}:`, error.message);
    }
}

module.exports = cleanupRecordings;