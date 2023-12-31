import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, telepon, certificateNumber, pdfDataUri } = req.body;

    console.log('Request Body:', req.body);

    console.log(JSON.stringify({
        name: name,
        email: email,
        telepon: telepon,
        certificateNumber: certificateNumber,
        pdfDataUri: pdfDataUri,
    }));

    if (!name || !certificateNumber) {
      return res.status(400).json({ error: 'Name and certificateNumber are required' });
    }

    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db('certificate-hi-tanampohon');
      const collection = db.collection('tanampohon-collection');

      const result = await collection.insertOne({
        name: name,
        email: email,
        telepon: telepon,
        certificateNumber: certificateNumber,
      });

      client.close();

      const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com', // Ganti dengan host yang sesuai
        secure: false,
        port: 587,
        auth: {
          user: 'admin@human-initiative.org', // Ganti dengan email pengirim
          pass: '1234Pkpu', // Ganti dengan password email pengirim
        },
      });

      // Opsi email
      const mailOptions = {
        from: 'admin@human-initiative.org', // Ganti dengan email pengirim
        to: email,
        subject: 'Informasi Sertifikat',
        text: `Terima Kasih ${name} yang telah Membantu menanam Pohon untuk Masa Depan, Ini adalah nomor certificate kamu ${certificateNumber}.`,
        attachments: [
          {
            filename: 'Certificate-TanamPohon.pdf',
            content: pdfDataUri.replace(/^data:application\/pdf;base64,/, ''),
            encoding: 'base64',
          },
        ],
      };

      // Mengirim email
      const info = await transporter.sendMail(mailOptions);

      return res.status(200).json({ success: true, data: result.ops[0] });
    } catch (error) {
      console.error('Error saving data to MongoDB:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
