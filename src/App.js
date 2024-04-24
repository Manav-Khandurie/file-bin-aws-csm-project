import React, { useState, useEffect } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { awsExports } from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from "aws-amplify";

Amplify.configure({
  Auth: {
    region: awsExports.REGION,
    userPoolId: awsExports.USER_POOL_ID,
    userPoolWebClientId: awsExports.USER_POOL_APP_CLIENT_ID
  }
});

function App() {
  const [accessToken, setAccessToken] = useState('');
  const [responseStatus, setResponseStatus] = useState('');
  const [responseContent, setResponseContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchAccessToken();
  }, []);

  const fetchAccessToken = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getAccessToken().getJwtToken(); // Get the access token
      setAccessToken(token);
    } catch (error) {
      console.log('Error fetching access token:', error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    try {
      const filesData = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const fileData = reader.result.split(',')[1]; // Get base64-encoded file data
          filesData.push({ name: file.name, data: fileData });
          if (filesData.length === selectedFiles.length) {
            // All files processed, send the request
            sendRequest(filesData);
          }
        };
      }
    } catch (error) {
      console.log('Error processing files:', error);
    }
  };

  const sendRequest = async (filesData) => {
    try {
      const apiUrl = 'https://nl1qqq5zqb.execute-api.us-east-1.amazonaws.com/prod/pvt';
      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: filesData })
      };

      const response = await fetch(apiUrl, requestOptions);

      if (response.ok) {
        setResponseStatus('Success');
        const responseData = await response.json();
        setResponseContent(JSON.stringify(responseData, null, 2));
      } else {
        setResponseStatus('Failure');
        const errorData = await response.json();
        setResponseContent(JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.log('Error uploading files:', error);
    }
  };

  return (
    <Authenticator initialState='signIn'
      components={{
        SignUp: {
          FormFields() {
            return (
              <>
                <Authenticator.SignUp.FormFields />

                {/* Custom fields for given_name and family_name */}
                <div><label>First name</label></div>
                <input
                  type="text"
                  name="given_name"
                  placeholder="Please enter your first name"
                />
                <div><label>Last name</label></div>
                <input
                  type="text"
                  name="family_name"
                  placeholder="Please enter your last name"
                />
                <div><label>Email</label></div>
                <input
                  type="text"
                  name="email"
                  placeholder="Please enter a valid email"
                />
              </>
            );
          },
        },
      }}
      services={{
        async validateCustomSignUp(formData) {
          if (!formData.given_name) {
            return {
              given_name: 'First Name is required',
            };
          }
          if (!formData.family_name) {
            return {
              family_name: 'Last Name is required',
            };
          }
          if (!formData.email) {
            return {
              email: 'Email is required',
            };
          }
        },
      }}
    >
      {({ signOut, user }) => (
        <div>
          <div>Welcome {user.username}</div>
          <button onClick={signOut}>Sign out</button>
          <h4>Your access token:</h4>
          {accessToken}
          <div>
            <h4>Select files to upload:</h4>
            <input type="file" multiple onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
          </div>
          <h4>Response Status:</h4>
          {responseStatus}
          <h4>Response Content:</h4>
          <pre>{responseContent}</pre>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
