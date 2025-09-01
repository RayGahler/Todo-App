const express = require('express')
const cors = require('cors')
const mysql = require('mysql')
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

var sqlConnected = true;
var Todos = {};



app = express()
app.use(cors())
app.use(express.json())

const connection = mysql.createConnection({"host" : "localhost", "database" : "DataBaseName", "user" : "UserName", "password" : "Password", "port" : "port"})

connection.connect((error) => {
    
    console.log("Could not connect to sql database")
    sqlConnected = false
})

app.get("/api/getTodos", (req,res) => {
  if(sqlConnected){
    connection.query("SELECT * FROM Todos", (err,resp) => {
        if(err){
            console.log(err)
            res.send(err)
        }
        else{
            res.send(resp)
        }
    })
  } else {
    // Return array of todos from fallback object
    res.send(Object.values(Todos));
  }
})

app.post("/api/postTodo", (req,res) => {
  console.log(req.body.params);
    const todo = {
      
      Title: req.body.params.Title,
      TDesc: req.body.params.About,
      Priority: req.body.params.Prio,
      TId: req.body.params.TId,
      Complete: false,
      Created: new Date(),
    };
    if(sqlConnected){
      connection.query(`INSERT INTO Todos (Title, TDesc, Priority, TId) VALUES ('${todo.Title}', '${todo.TDesc}', '${todo.Priority}', '${todo.TId}')`, (err,resp) => {
          if(err){
              res.send(err)
          }
          else{
              res.send(resp)
          }
      })
    } else {
      Todos[todo.TId] = todo;
      res.send({ success: true, todo });
    }
})

app.post("/api/updateTodo", (req,res) => {
    if(sqlConnected){
      connection.query(`UPDATE Todos SET TDESC="${req.body.params.About}" WHERE TId= '${req.body.params.Id}'`, (err,resp) => {
          if(err){
              res.send(err)
          }
          else{
              res.send(resp)
          }
      })
    } else {
      if (Todos[req.body.params.Id]) {
        Todos[req.body.params.Id].TDesc = req.body.params.About;
        res.send({ success: true, todo: Todos[req.body.params.Id] });
      } else {
        res.status(404).send({ error: 'Todo not found' });
      }
    }
})

app.post("/api/deleteTodo", (req,res) =>{
    if(sqlConnected){
      connection.query(`DELETE FROM Todos WHERE TId = '${req.body.params.Id}'`, (err,resp) => {
          if(err){
              res.send(err)
          }
          else{
              res.send(resp)
          }
      })
    } else {
      if (Todos[req.body.params.Id]) {
        delete Todos[req.body.params.Id];
        res.send({ success: true });
      } else {
        res.status(404).send({ error: 'Todo not found' });
      }
    }
})

app.post("/api/completeTodo", (req,res) =>{
    if(sqlConnected){
      connection.query(`UPDATE Todos SET Complete=${req.body.params.Complete} WHERE TId= '${req.body.params.Id}'`, (err,resp) => {
          if(err){
              res.send(err)
          }
          else{
              res.send(resp)
          }
      })
    } else {
      if (Todos[req.body.params.Id]) {
        Todos[req.body.params.Id].Complete = req.body.params.Complete;
        res.send({ success: true, todo: Todos[req.body.params.Id] });
      } else {
        res.status(404).send({ error: 'Todo not found' });
      }
    }
})


app.listen(3000, ()=>{
    console.log("listening on localhost:3000")
})


/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}



/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log('Upcoming 10 events:');
  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
  });
}


