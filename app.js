// Environment variables should be handled securely, especially for production
// Consider using a package like dotenv for managing them

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const Imap = require('imap');
const { MailParser } = require('mailparser');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use environment variables or a secure method to store sensitive data
const imapConfig = {
    user: 'rol4nd58220@gmail.com',
    password: 'fkjo zlty kbaq qsha',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 30000 // 10 seconds, adjust as needed
};

let messages = {
    sms: ["Sample SMS message 1", "Sample SMS message 2"],
    email: []
};

function startEmailPolling() {
    fetchEmails(); // Initial fetch
    setInterval(fetchEmails, 600000); // Poll every 60 seconds
}

function fetchEmails() {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('Error opening inbox:', err);
                return;
            }

            const fetch = imap.seq.fetch(box.messages.total + ':*', { bodies: [''] });
            fetch.on('message', (msg) => {
                const parser = new MailParser();
                msg.on('body', (stream) => {
                    stream.pipe(parser);
                });
                parser.on('headers', headers => {
                    const from = headers.get('from').value[0].address;
                    parser.on('data', (data) => {
                        if (data.type === 'text') {
                            const emailMessage = {
                                text: data.text,
                                sender: from
                            };
                            messages.email.push(emailMessage);
                            io.emit('updateMessages', messages);
                        }
                    });
                });
            });

            fetch.once('error', (err) => {
                console.error('Fetch error:', err);
            });
            fetch.once('end', () => {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });

    imap.once('error', (err) => {
        console.error('IMAP error:', err);
    });

    imap.once('end', () => {
        console.log('IMAP connection ended');
    });

    imap.connect();
}


function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}

io.on('connection', (socket) => {
    console.log('New WebSocket connection');
    socket.emit('updateMessages', messages);

    // Event listener for 'sendEmailReply'
    socket.on('sendEmailReply', ({ replyText, senderEmail }) => {
        console.log('Sender Email:', senderEmail); // Debugging line
        // Call the sendEmailReply function to handle the email sending
        if(senderEmail && isValidEmail(senderEmail)) {
            sendEmailReply(replyText, senderEmail);
        } else {
            console.error('Invalid or missing recipient email address');
        }
    });
});


function sendEmailReply(replyText, senderEmail) {
    // Configure your email transport
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'rol4nd58220@gmail.com',
            pass: 'fkjo zlty kbaq qsha',
        }
    });

    // Prepare email options
    const mailOptions = {
        from: 'rol4nd58220@gmail.com',
        to: senderEmail, // Sender's email, dynamically set
        subject: 'Reply from Your Website',
        text: replyText
    };

    // Send the email
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error sending email: ', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/get-messages', (req, res) => {
    console.log('GET /get-messages called', messages);
    res.json({ success: true, messages: messages });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startEmailPolling(); // Start polling for emails
});
