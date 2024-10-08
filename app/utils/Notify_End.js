// Notify_End.js

const { getRecordingLink } = require('./getRecordingLink');
const { zadarma_express_handler } = require('./zadarma_express_handler');

async function handleNotifyEnd(req, res) {
  const { pbx_call_id } = req.body;
  const recordingLink = await getRecordingLink(pbx_call_id);
  if (recordingLink) {
    console.log('Recording link:', recordingLink);
    // Procesare suplimentară cu link-ul de înregistrare...
  }
  res.status(200).send({ status: 'ok', data: { pbx_call_id, recordingLink } });
}

zadarma_express_handler.on('NOTIFY_END', handleNotifyEnd);

module.exports = handleNotifyEnd;
