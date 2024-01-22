var leftLoginBtn;
var leftExitBtn;

function loadLoginPage()
{
    let client = new XMLHttpRequest();
    client.open('GET', './pages/login.html');
    client.addEventListener('loadend', function() { appendLoginPage(client) } );
    client.send();
}

function appendLoginPage(httpClient)
{
    let result = httpClient.responseText;
    let domConversion = new DOMParser().parseFromString(result, 'text/html');
    let elements = domConversion.getElementById('login-container');

    document.getElementById('main').appendChild(elements);

    let scriptNode = document.createElement('script');
    scriptNode.src = 'scripts/login.js';
    scriptNode.id = 'login-script';
    document.body.appendChild(scriptNode);
}

function start(){
    leftLoginBtn = document.getElementById('login-button');
    leftExitBtn = document.getElementById('exit-button');

    leftLoginBtn.addEventListener('click', () => { 
        let reportElements = document.getElementById('content-container');
        let loginElements = document.getElementById('login-container');
        let reportScript = document.getElementById('report-script');
        let loginScript = document.getElementById('login-script');
    
        if(reportElements !== null)
            reportElements.remove();
        if(reportScript !== null)
            reportScript.remove();
    
        if(loginElements !== null)
            loginElements.remove();
        if(loginScript !== null)
            loginScript.remove();
        
        loadLoginPage();
    } );
    
    leftExitBtn.addEventListener('click', () => {
        let client = new XMLHttpRequest();
        client.open('GET', '/exit');
        client.send();
        window.location.assign('https://www.google.com.br');
        window.close();
    } );
    
    if(document.getElementById('is-connected') !== null){
        let request = new XMLHttpRequest();
        request.open('GET', './pages/report.html');
        request.addEventListener('loadend', () => {
            let result = request.responseText;
            let domConversion = new DOMParser().parseFromString(result, 'text/html');
            let elements = domConversion.getElementById('content-container');
            
            document.getElementById('main').appendChild(elements);
    
            let filterRequest = new XMLHttpRequest();
            filterRequest.open('GET', './filtros/formatos.json');
            filterRequest.addEventListener('loadend', () => {
                let result = JSON.parse(filterRequest.responseText);
                campoTypes = result;
                let list = document.getElementById('campo-lista');
    
                for(let i = 0; i < result.Campos.length; i++){
                    let item = result.Campos[i].Campo;
                    let option = document.createElement('option');
                    option.setAttribute('value', item);
    
                    list.appendChild(option);
                }
    
                let scriptNode = document.createElement('script');
                scriptNode.src = 'scripts/report.js';
                scriptNode.id = 'report-script';
    
                document.body.appendChild(scriptNode);
            } );
    
            filterRequest.send();
        } );
        request.send();
    }
}

try{
    start();
}catch{}
