// Notify_Record.js

const getRecordingLink = require('./getRecordingLink');
const zadarma_express_handler = require('./zadarma_express_handler');

async function handleNotifyRecord(req, res) {
  const { pbx_call_id, call_id_with_rec } = req.body;

  try {
    console.log('Handling NOTIFY_RECORD for pbx_call_id:', pbx_call_id);
    const recordingLink = await getRecordingLink(pbx_call_id);

    if (recordingLink) {
      console.log('Recording link obtained:', recordingLink);
      // Aici poți adăuga logică suplimentară pentru a gestiona link-ul de înregistrare.
    } else {
      console.log('No recording link available.');
    }

    res.status(200).send({ status: 'ok', data: { pbx_call_id, call_id_with_rec, recordingLink } });
  } catch (error) {
    console.error('Error handling NOTIFY_RECORD event:', error);
    res.status(500).send({ status: 'error', message: 'Internal Server Error' });
  }
}

zadarma_express_handler.on('NOTIFY_RECORD', handleNotifyRecord);

module.exports = handleNotifyRecord;
  