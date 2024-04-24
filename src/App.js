// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { Amplify } from 'aws-amplify';
import { awsExports } from './aws-exports';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from "aws-amplify";
import logo from './MainLogo.png';

// Configure AWS Amplify
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

  // Fetch access token on component mount
  useEffect(() => {
    fetchAccessToken();
  }, []);

  // Function to fetch access token
  const fetchAccessToken = async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getAccessToken().getJwtToken();
      setAccessToken(token);
    } catch (error) {
      console.log('Error fetching access token:', error);
    }
  };

  // Function to handle file change
  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  // Function to handle file upload
  const handleUpload = async () => {
    try {
      const filesData = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const fileData = reader.result.split(',')[1];
          filesData.push({ name: file.name, data: fileData });
          if (filesData.length === selectedFiles.length) {
            sendRequest(filesData);
          }
        };
      }
    } catch (error) {
      console.log('Error processing files:', error);
    }
  };

  // Function to send file upload request
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
      <div className="container">
        <div className="header">
          <Authenticator initialState='signIn'>
            {({ signOut, user }) => (
              <div>
                <div className="logo">
                  <img src={logo} alt="Main Logo" />
                </div>
                <div>Welcome {user.username}</div>
                <button onClick={signOut}>Sign out</button>
                <div className="form-section">
                  {/* <h4>Your access token:</h4>
                  <div className="token">{accessToken}</div> */}
                </div>
                <div className="file-upload form-section">
                  <h4>Select files to upload:</h4>
                  <input id="file-upload" type="file" multiple onChange={handleFileChange} />
                  <label htmlFor="file-upload" className="upload-btn">Choose Files</label>
                  <button onClick={handleUpload} className="upload-btn">Upload</button>
                </div>
                <div className="response-section">
                  <h4>Response Status:</h4>
                  <div className="status">{responseStatus}</div>
                  <h4>Response Content:</h4>
                  <pre className="content">{responseContent}</pre>
                </div>
              </div>
            )}
          </Authenticator>
        </div>
      </div>

  );
}

export default App;
