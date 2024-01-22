var campoTypes = null;
var loginBtn = document.getElementById('login-container-button');
loginBtn.addEventListener('click', () => {
    if(loginBtn.classList.contains('lock') )
        return;
    
    loginBtn.classList.add('lock');
    let user = document.getElementById('email-input').value.trim();
    let password = document.getElementById('password-input').value;
    if(user.length === 0 || password.length === 0)
    {
        loginBtn.classList.remove('lock');
        window.alert('O campo \'email\' e o campo \'senha\' n&atilde;o podem ficar vazios!');
        return;
    }
    
    let request = new XMLHttpRequest();
    request.open('GET', `/login?user=${user}&password=${password}`);
    request.addEventListener('loadend', () => { OnLoginRequestEnd(request); } );
    request.addEventListener('error', () => 
    { 
        loginBtn.classList.remove('lock');
        window.alert('Um erro desconhecido ocorreu enquanto o login era validado.');
        return;
    } );

    request.send();
} );

function OnLoginRequestEnd(request)
{
    if(request.status !== 200)
    {
        loginBtn.classList.remove('lock');
        document.getElementById('email-input').value = '';
        document.getElementById('password-input').value = '';
        window.alert('Email e/ou senha inv&aacute;lido(s)!\nTente novamente!');
        return;
    }

    document.body.removeChild(document.getElementById('login-script') );
    document.getElementById('main').removeChild(document.getElementById('login-container') );
    request = new XMLHttpRequest();
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