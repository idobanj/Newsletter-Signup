//jshint esversion: 6
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();

// Environment variables for security
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/', function (req, res) {
  const {firstName, lastName, email} = req.body;

  // Basic validation
  if (!firstName || !lastName || !email) {
    return res.sendFile(__dirname + '/failure.html');
  }

  const data = {
    members: [
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);
  const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}`;

  const options = {
    method: 'POST',
    auth: `anystring:${MAILCHIMP_API_KEY}`,
  };

  const request = https.request(url, options, (response) => {
    let responseData = '';

    response.on('data', (chunk) => {
      responseData += chunk;
    });

    response.on('end', () => {
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log(jsonResponse);
        // console.log(response);

        // if (response.statusCode === 200) {
        //succeSS = res.sendFile(__dirname + '/success.html');
        // } else if (
        //   jsonResponse.errors.some(
        //     (item) => item.error_code === 'ERROR_CONTACT_EXISTS'
        //   )
        // ) {
        //exisTed = res.sendFile(__dirname + '/existed_email.html');
        // } else {
        //   res.sendFile(__dirname + '/failure.html');
        // }

        if (jsonResponse.new_members && jsonResponse.new_members.length === 0) {
          res.sendFile(__dirname + '/existed_email.html');
        } else if (
          jsonResponse.new_members &&
          jsonResponse.new_members.length > 0
        ) {
          res.sendFile(__dirname + '/success.html');
        }
      } catch (error) {
        console.error('Parse Error:', error);
        res.sendFile(__dirname + '/failure.html');
      }
    });
  });

  request.on('error', (error) => {
    console.error('Request Error:', error);
    res.sendFile(__dirname + '/failure.html');
  });

  request.write(jsonData);
  request.end();
});

app.post('/failure', function (req, res) {
  res.redirect('/');
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Server is running on port ' + (process.env.PORT || 3000));
});
