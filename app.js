const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const qs = require('query-string');
app.use(cors());

// Constand
const urlToGetLinkedInAccessToken = 'https://www.linkedin.com/oauth/v2/accessToken';
const urlToGetUserProfile ='https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~digitalmediaAsset:playableStreams))'
const urlToGetUserEmail = 'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))';

app.get('/getUserCredentials', async function (req, res) {
  let user = {};
  const code = req.query.code;
  console.log('>>> Code:', code)
  const accessToken =  await getAccessToken(code);
  console.log('>>> AccessToken:', accessToken)
  const userProfile = await getUserProfile(accessToken);
  console.log('>>> UserProfile:', userProfile)
  const userEmail = await getUserEmail(accessToken);
  console.log('>>> UserEmail:', userEmail)
  let resStatus = 400;
  if(accessToken && userProfile && userEmail) {
    user = userBuilder(userProfile, userEmail);
    resStatus = 200;
  }
  // Here, you can implement your own login logic 
  // to authenticate new user or register him
  console.log('>>> Response:', resStatus, user)
  res.status(resStatus).json({ user });
})

/**
 * Get access token from LinkedIn
 * @param code returned from step 1
 * @returns accessToken if successful or null if request fails 
 */
async function getAccessToken(code) {
  const config = {
    headers: { "Content-Type": 'application/x-www-form-urlencoded' }
  };
  const parameters = {
    "grant_type": "authorization_code",
    "code": code,
    "redirect_uri": 'https://cq-linkedinfe.onrender.com/linkedin',
    "client_id": '78x7t1w2judka1',
    "client_secret": '4DnhkoqK1gLew8ts',
  };
  try {
    const response = await axios.post(urlToGetLinkedInAccessToken, qs.stringify(parameters), config);
    const accessToken = response.data["access_token"];
    return accessToken;
  } catch(e) {
    console.log("Error getting LinkedIn access token");
  }
}

/**
 * Get user first and last name and profile image URL
 * @param accessToken returned from step 2
 */
async function getUserProfile(accessToken) {
  const config = {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  }
  try {
    const response = await axios.get(urlToGetUserProfile, config);
    const userProfile = {
      firstName: response.data["localizedFirstName"],
      lastName: response.data["localizedLastName"],
      profileImageURL: response.data.profilePicture["displayImage~"].elements[0].identifiers[0].identifier,
    };
    return userProfile;
  } catch (error) {
    console.log("Error grabbing user profile")
  }
}


/**
 * Get user email
 * @param accessToken returned from step 2
 */
async function getUserEmail(accessToken) {
  const config = {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  };
  try {
    const response = await axios.get(urlToGetUserEmail, config);
    const email = response.data.elements[0]["handle~"];
    return email;
  } catch (error) {
    console.log("Error getting user email")
  }
}

/**
 * Build User object
 */
function userBuilder(userProfile, userEmail) {
  return {
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    profileImageURL: userProfile.profileImageURL,
    email: userEmail
  }
}

const PORT = process.env.PORT || 3003;

app.listen(PORT, function () {
  console.log(`Node server running on port ${PORT}...`)
});