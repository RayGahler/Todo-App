
import { createApp } from 'vue/dist/vue.esm-bundler';
import axios from 'axios';


const app = createApp({
    data() {
        return {
            CLIENT_ID: import.meta.env.VITE_CLIENT_ID,
            API_KEY: import.meta.env.VITE_API_KEY,
            DISCOVERY_DOC : "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
            SCOPES : "https://www.googleapis.com/auth/calendar",
            tokenClient : undefined,
            gapiInited : false,
            gisInited : false,
            Reversed : false,
            TodoPrio:5,
            sortMethod : "Id",
            TodoName : "",
            TodoDesc : "",
            Todos : [],
            CompletedTodos : [],
            showCompleted : false,
            SelectedTodo : undefined,
            EditingTodo : undefined,
            newTodoText : undefined,
            isOffline : false,
            sessionJson : "",
        }
  },
  methods : {
    async getTodos(){

        if(this.isOffline){
            this.Todos = JSON.parse(sessionStorage.getItem("Todos"))
            this.CompletedTodos = this.Todos.filter((todo) => todo.Complete == true)
            return
        }        

        await axios.get("http://localhost:3000/api/getTodos").then((data) => {
            this.Todos = data.data
            this.CompletedTodos = this.Todos.filter((todo) => todo.Complete == true)
            this.Todos = this.Todos.filter((todo) => todo.Complete == false)

        }).catch((error) => {
            console.error("Error fetching todos:", error)
            this.isOffline = true
            var sessionData = JSON.parse(sessionStorage.getItem("Todos"))
            this.Todos = sessionData != null || sessionData != undefined ? sessionData : []
            this.CompletedTodos = this.Todos.filter((todo) => todo.Complete == true)
            
        })
        .finally(()=>{
            console.log("Sooooo we're done")
        })
    },
    reverseTodos(){
        this.Reversed = !this.Reversed
        this.Todos.reverse()
        this.CompletedTodos.reverse()
    },
    async postTodo(){
        let idStuff = ['1','2','3','4','5','6','7','8','9','0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
        var id = ""
        for(let i = 0; i < 6; i++){
            id += idStuff[Math.floor(Math.random() * idStuff.length)]
            
        }
        console.log(id)
        if(!this.TodoName){
            console.log("Nop")
            return
        }

        if(this.isOffline){
            
            this.Todos.push({"Title" : this.TodoName, "TDesc" : this.TodoDesc, "Priority" : this.TodoPrio, "TId" : id, "Created" : Date.now()})
            sessionStorage.setItem("Todos", JSON.stringify(this.Todos))
            this.getTodos();
            this.clearText();
            return

        }

        await axios.post("http://localhost:3000/api/postTodo",{params : {"Title" : this.TodoName, "About" : this.TodoDesc, "Prio" : this.TodoPrio, "TId" : id}}).then((data) => {
            console.log(data)
        }).finally(()=>{
            console.log("Sooooo we're done")
        })
        this.getTodos()
        this.PostEventToCalendar(id)
        this.clearText()
    },
    async deleteTodo(Todo){

        if(this.isOffline){
            
            this.Todos = this.Todos.filter((currentTodo) => {return currentTodo.TId != Todo.TId})
            console.log(this.Todos)
            sessionStorage.setItem("Todos", JSON.stringify(this.Todos))
            return
        }

        await axios.post("http://localhost:3000/api/deleteTodo",{params : {"Id" : Todo.TId}}).then((data) => {
            console.log(data)
        }).finally(()=>{
            console.log("Sooooo we're done")
        })
        this.getTodos()
    },
    async MarkComplete(Todo){
        console.log(Todo.Complete)
        Todo.Complete = !Todo.Complete
        if(this.isOffline){
            sessionStorage.setItem("Todos", JSON.stringify(this.Todos))
            return
        }
        await axios.post("http://localhost:3000/api/completeTodo",{params : {"Id" : Todo.TId, "Complete" : Todo.Complete}}).then((data) => {
            console.log(data)
        }).finally(()=>{
            console.log("Sooooo we're done")
        })
        this.getTodos()
    },
    async UpdateTodo(Todo){
        for(var i = 0; i < this.Todos.length; i++){
            if(this.Todos[i].TId == Todo.TId){
                this.Todos[i].TDesc = this.newTodoText
                sessionStorage.setItem("Todos", JSON.stringify(this.Todos))
                return
            }
        }
        await axios.post("http://localhost:3000/api/updateTodo",{params : {"Id" : Todo.TId, "About" : this.newTodoText}}).then((data) => {
            console.log(data)
        }).finally(()=>{
            console.log("Sooooo we're done")
        })
        this.getTodos()
    },
    selectTodo(Todo){
        this.SelectedTodo = Todo
    },
    editTodo(Todo){
        this.EditingTodo = Todo
    },
    clearText(){
        this.TodoName = ""
        this.TodoDesc = ""
    },
    sortTodos(method){
        console.log(this.CompletedTodos)
        console.log("Sorting by " + method)
        this.sortMethod = method
        if(this.sortMethod === "Id"){
            this.Todos.sort((a, b) => a.TId > b.TId ? 1 : -1)
        } else if(this.sortMethod === "Title"){
            this.Todos.sort((a, b) => a.Title.toLowerCase() > b.Title.toLowerCase() ? 1 : -1)
        } else if(this.sortMethod === "Complete"){
            this.Todos.sort((a, b) => a.Id - b.Id)
            this.Todos.sort((a, b) => (a.Complete != b.Complete) && b.Complete == true ? -1 : 1)
        } else if(this.sortMethod === "Prio"){
            this.Todos.sort((a, b) => a.Priority > b.Priority ? 1 : -1)
        } else if(this.sortMethod === "Date"){
            this.Todos.sort((a, b) => new Date(b.Created) - new Date(a.Created))
        }

        
    },

      

     

      /**
       * Callback after api.js is loaded.
       */
      gapiLoaded() {
        gapi.load('client', this.initializeGapiClient);
      },

      /**
       * Callback after the API client is loaded. Loads the
       * discovery doc to initialize the API.
       */
      async initializeGapiClient() {
        await gapi.client.init({
          apiKey: this.API_KEY,
          discoveryDocs: [this.DISCOVERY_DOC],
        });
        this.gapiInited = true;
        this.maybeEnableButtons();
      },

      /**
       * Callback after Google Identity Services are loaded.
       */
      gisLoaded() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: '', // defined later
        });
        this.gisInited = true;
        this.maybeEnableButtons();
      },

      /**
       * Enables user interaction after all libraries are loaded.
       */
      maybeEnableButtons() {
        if (this.gapiInited && this.gisInited) {
          document.getElementById('SignInButton').hidden = false;
        }
      },

    SignInGoogle(){
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
        //   document.getElementById('authorize_button').innerText = 'Refresh';
        //   await listUpcomingEvents();
        console.log(document.getElementById('SignInButton'))
        document.getElementById('SignInButton').hidden = true;
        document.getElementById('SignOutButton').hidden = false;

        // try {
        //   const request = {
        //     'calendarId': 'primary',
        //     'timeMin': new Date(new Date()- 60*60*1000*24*7).toISOString(), // 7 days ago
        //     'showDeleted': false,
        //     'singleEvents': true,
        //     'maxResults': 100,
        //     'orderBy': 'startTime',
        //   };
        //   console.log(gapi)
        //   let response = await gapi.client.calendar.events.list(request);

        //   const events = response.result.items;
        //   if (!events || events.length == 0) {
        //     console.log('No Google Events.');
        //     return;
        // }
        // for (let i = 0; i < events.length; i++) {
        //     console.log(events[i])
        //     if(events[i].source && events[i].source.title === "Todo Link"){
        //         console.log("Found Todo Event")
        //     }
        // }

        // } catch (err) {
        //   console.log('Execute error', err);
        //   return;
        // }

        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          this.tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          this.tokenClient.requestAccessToken({prompt: ''});
        }
        


        this.getEvent();
    },
    SignOutGoogle(){
        console.log(gapi)
        const token = gapi.client.getToken();
        console.log(token)
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            
            gapi.client.setToken('');
            
            document.getElementById('SignInButton').hidden = false;
            document.getElementById('SignOutButton').hidden = true;
        }
    },
    async getEvent(){
        let response;
        try {
          const request = {
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime',
          };
          console.log(gapi)
          response = await gapi.client.calendar.events.list(request);
        } catch (err) {
          console.log('Execute error', err);
          return;
        }

        const events = response.result.items;
        if (!events || events.length == 0) {
          console.log('No upcoming events found.');
          return;
        }
        // Flatten to string to display
        const output = events.reduce(
            (str, event) => `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,
            'Events:\n');
        console.log(output);
    },

    async PostEventToCalendar(id){

        console.log(this.TodoName)
        let lmao = {
            'summary': `${this.TodoName}`,
            'description': `${this.TodoDesc}`,
            'start': {
                'dateTime': new Date(Date.now()).toISOString(),
            },
            'end': {
                'dateTime': new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            'id': id,
            'source': {
                'url': window.location.href,
                'title': 'Todo Link'
            }
        }

        let request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': lmao
        });
        request.execute(function(event) {
            console.log('Event created: ' + event.htmlLink);
        });
    }

  },
  mounted(){
        this.MarkComplete.bind(this)
        this.sortTodos.bind(this)
        window.gapiLoaded = this.gapiLoaded
        window.gisLoaded = this.gisLoaded
        this.gisLoaded.bind(this)
        this.getTodos()

        document.getElementById('SignOutButton').hidden = true;

        let gapiScript = document.createElement('script')
        gapiScript.defer = true
        gapiScript.async = true
        gapiScript.onreadystatechange = gapiScript.onload = function () {
            const interval = setInterval(function () {
            if (!gapiScript.readyState || /loaded|complete/.test(gapiScript.readyState)) {
                clearInterval(interval)
                if (window.gapi) {
                gapiLoaded()
                } else {
                console.log('Failed to load gapi')
                }
            }
            }, 100)
        }
        gapiScript.src = 'https://apis.google.com/js/api.js'
        document.head.appendChild(gapiScript)

        let gisScript = document.createElement('script')
        gisScript.defer = true
        gisScript.async = true
        gisScript.onreadystatechange = gisScript.onload = function () {
            const interval = setInterval(function () {
            if (!gisScript.readyState || /loaded|complete/.test(gisScript.readyState)) {
                clearInterval(interval)
                if (window.google && window.google.accounts) {
                gisLoaded()
                } else {
                console.log('Failed to load gis')
                }
            }
            }, 100)
        }
        gisScript.src = 'https://accounts.google.com/gsi/client'
        document.head.appendChild(gisScript)
  },
  watch : {
    
  }
}).mount("#app")

// Send a request to /api/saveFile when the user leaves the website
window.addEventListener('beforeunload', function (e) {
    axios.post("http://localhost:3000/api/saveFile",).then((data) => {
            console.log(data)
        }).finally(()=>{
            console.log("Sooooo we're done")
        })
});
