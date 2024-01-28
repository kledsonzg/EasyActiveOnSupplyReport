var result = new Document();
var resultInput = null;
var resultCheckBoxes = [];
var resultCheckBoxesValues = [true, true, true, true, true, true, true, true];

var reportInputs = {
    campo: document.getElementById('input-campo'),
    operador: document.getElementById('input-operador'),
    ano: document.getElementById('input-ano'),
    top: document.getElementById('input-top'),
    valor: document.getElementById('input-valor'),
    adicionar: document.getElementById('filter-button'),
    exportar: document.getElementById('export-button'),
    isNotANumber: function(content){
        let numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let dotSymbolFound = false;
        for(let i = 0; i < content.length; i++){
            if(numbers.includes(parseInt(content[i] ) ) )
                continue;
            // Para validar um número flutuante.
            if( (content[i] === ',' || content[i] === '.') ){
                if(dotSymbolFound === true)
                    return true;
                
                dotSymbolFound = true;
                continue;
            }
            return true;
        }
        return false
    },
    changeOperatorsList: function(){
        let type = 'System.String';
        for(let i = 0; i < campoTypes.Campos.length; i++){
            if(this.campo.value !== campoTypes.Campos[i].Campo)
                continue;

            let operatorsList = Array.from(document.getElementById('operador-lista').children);

            operatorsList.forEach(o => {
                if(!campoTypes.Campos[i].Operadores.includes(o.getAttribute('value') ) ){
                    if(o.tagName.toLowerCase() === 'option')
                        o.disabled = true;
                }
                else if(o.tagName.toLowerCase() === 'option')
                    o.disabled = false;
            } );
            operatorsList = operatorsList.filter(o => o.disabled !== true);

            if(!operatorsList.includes(this.operador.value) ){
                this.operador.value = '';
                this.lastValues.operador = '';
            }
                
        }
    },
    changeValueInputType: function(){
        let type = 'System.String';
        let rule = '';
        for(let i = 0; i < campoTypes.Campos.length; i++){
            if(this.campo.value !== campoTypes.Campos[i].Campo)
                continue;

            type = campoTypes.Campos[i].Tipo;
            console.log(type);
            rule = campoTypes.Campos[i].regra === undefined ? '' : campoTypes.Campos[i].regra;
            break;
        }
        switch(type){
            case 'System.String':
                if(this.valor.getAttribute('list') !== null)
                    this.valor.removeAttribute('list');

                this.valor.value = '';
                this.valor.setAttribute('type', 'text');
                break;
            case 'System.DateTime':
                if(this.valor.getAttribute('list') !== null)
                    this.valor.removeAttribute('list');

                this.valor.value = '';
                this.valor.setAttribute('type', 'date');
    
                let date = new Date();
                let month = date.getMonth() + 1;
                let day = date.getDate();
                this.valor.value = `${date.getFullYear()}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
                break;
            case 'System.Decimal':
                if(this.valor.getAttribute('list') !== null)
                    this.valor.removeAttribute('list');

                    this.valor.value = '';
                    this.valor.setAttribute('type', 'text');
                    break;
            case 'System.Boolean':
                this.valor.value = '';
                this.valor.setAttribute('type', 'text');
                this.valor.setAttribute('list', 'booleanos-lista');
                break;
            default:
                if(this.valor.getAttribute('type') !== null){
                    this.valor.value = '';
                    this.valor.removeAttribute('type');
                }
                break;
        }
    },
    getValueTypeByCampoValue: function(){
        let type = 'System.String';
        for(let i = 0; i < campoTypes.Campos.length; i++){
            if(this.campo.value !== campoTypes.Campos[i].Campo)
                continue;

            type = campoTypes.Campos[i].Tipo;
            return type;
        }

        return type;
    },
    lastValues: {
        campo: '',
        operador: '',
        ano: '',
        top: ''
    }
}

// INPUT TOP:
reportInputs.top.addEventListener('input', () => {
    if(reportInputs.isNotANumber(reportInputs.top.value) )
        reportInputs.top.value = reportInputs.lastValues.top;

    reportInputs.lastValues.top = reportInputs.top.value;
} );

// INPUT ANO:
reportInputs.ano.addEventListener('input', () => {
    if(reportInputs.isNotANumber(reportInputs.ano.value) )
        reportInputs.ano.value = reportInputs.lastValues.ano;

    reportInputs.lastValues.ano = reportInputs.ano.value;
} );

// INPUT CAMPO:
reportInputs.campo.addEventListener('focusin', () => {
    reportInputs.campo.value = '';
} );
reportInputs.campo.addEventListener('focusout', () => {
    validarInputCampo();
} );

// INPUT OPERADOR:
reportInputs.operador.addEventListener('focusin', () => {
    reportInputs.operador.value = '';
} );
reportInputs.operador.addEventListener('focusout', () => {
    validarInputOperador();
} );

//INPUT ADICIONAR:
reportInputs.adicionar.addEventListener('click', () => {
    if(reportInputs.campo.value.length === 0 || reportInputs.operador.value.length === 0)
    {
        window.alert('As caixas de texto \'CAMPO\' e \'OPERADOR\' n&atilde;o podem ficar vazias.');
        return;
    }

    let resultRow = createResultRow(reportInputs.campo.value, reportInputs.operador.value, reportInputs.valor);
    
    document.getElementById('filters-container').appendChild(resultRow);
    
    reportInputs.campo.value = '';
    reportInputs.operador.value = '';
    reportInputs.valor.value = '';
} );
//INPUT EXPORTAR:
reportInputs.exportar.addEventListener('click', () => {
    if(reportInputs.exportar.classList.contains('locked') )
        return;

    reportInputs.exportar.classList.add('locked');
    let json = {
        filtro: []
    };
    let rows = Array.from(document.getElementsByClassName('result-row') );

    rows.forEach(row => {
        let childs = Array.from(row.children);
        let filters = childs.filter(element => element.classList.contains('filter') );
        let inputs = [];
        let campo = '', operador = 'Todos', valor = 'null', type = 'System.String';

        filters.forEach(element => {
                Array.from(element.children).forEach(input => { 
                    inputs.push(input); 
            } );
        } );

        inputs.forEach(input => {    
            if(input.classList.contains('result-column-campo') )
                campo = input;
            else if(input.classList.contains('result-column-operador') )
                operador = input;
            else if(input.classList.contains('result-column-valor') )
                valor = input;
        } );
        
        console.log(valor.value);
        for(let i = 0; i < campoTypes.Campos.length; i++){
            if(campo.value !== campoTypes.Campos[i].Campo)
                continue;

            type = campoTypes.Campos[i].Tipo;
            break;
        }

        json.filtro.push( {
            Ano: reportInputs.ano.value,
            Campo: campo.value,
            ComboValor: '',
            Operador: operador.value,
            Tipo: type,
            Top: reportInputs.top.value,
            Valor: valor.getAttribute('type') === 'date' ? getFixedDateString(valor) : type === 'System.Decimal' ?
                getFixedDecimalValue(valor) : valor.value
        } );
    } );
    
    let client = new XMLHttpRequest();
    client.open('POST', '/export');
    client.addEventListener('error', () => {
        reportInputs.exportar.classList.remove('locked');
        window.alert('N&atilde;o foi poss&iacute;vel obter o resultado requisitado.');
    } );
    client.addEventListener('loadend', () => {
        reportInputs.exportar.classList.remove('locked');
        result = new DOMParser().parseFromString(client.responseText, 'text/html');

        client = new XMLHttpRequest();
        client.open('GET', '/pages/result.html');
        client.addEventListener('loadend', () => {
            let bodyChildren = Array.from(document.body.children);
            let elements = [document.getElementById('result-styles'), document.getElementById('result-background') ];
            
            elements.forEach(e => {
                if(e !== null)
                    if(bodyChildren.includes(e) )
                        e.remove();
            } );

            let doc = new DOMParser().parseFromString(client.responseText, 'text/html');
            elements = [doc.getElementById('result-styles'), doc.getElementById('result-background') ];

            elements.forEach(e => { document.body.appendChild(e) } );
     
            while(resultCheckBoxes.length > 0)
                resultCheckBoxes.pop();

            resultInput = document.getElementById('result-content-input');
            resultCheckBoxes = Array.from(document.getElementsByTagName('input') );
            resultCheckBoxes = resultCheckBoxes.filter(input => isValidResultCheckbox(input) );

            resultCheckBoxes.forEach(checkbox => {
                checkbox.checked = true;
                checkbox.addEventListener('click', () =>{ onResultCheckBoxCheck(); } );
            } );

            onResultCheckBoxCheck();
        } );

        client.send();
    } );

    let jsonString = JSON.stringify(json);
    console.log(jsonString);
    client.send(jsonString);
} )

function validarInputCampo()
{
    let isValid = false;

    for(let i = 0; i < campoTypes.Campos.length; i++){
        let campo = campoTypes.Campos[i];
        if(campo.Campo !== reportInputs.campo.value)
            continue;

        isValid = true;
        break;
    }
    if(isValid === false){
        if(reportInputs.campo.value === '')
            reportInputs.campo.value = reportInputs.lastValues.campo;
        else reportInputs.campo.value = '';

        reportInputs.changeOperatorsList();
        return false;
    }
        
    reportInputs.changeValueInputType();
    reportInputs.changeOperatorsList();
    reportInputs.lastValues.campo = reportInputs.campo.value;
    return true;
}

function validarInputOperador()
{
    let isValid = false;
    let optionElements = Array.from(document.getElementById('operador-lista').children);
    let options = [];

    optionElements.forEach(e => {
        options.push(e.getAttribute('value') );
    } );


    for(let i = 0; i < options.length; i++){
        if(options[i] !== reportInputs.operador.value)
            continue;

        isValid = true;
        break;
    }
    if(isValid === false){
        if(reportInputs.operador.value === '')
            reportInputs.operador.value = reportInputs.lastValues.operador;
        else reportInputs.operador.value = '';
        
        return false;
    }
    
    reportInputs.lastValues.operador = reportInputs.operador.value;
    return true;
}

function createResultRow(campoValue, operadorValue, valor){
    let resultRow = document.createElement('div');
    resultRow.classList.add('result-row');

    const rowRecipe = 
        [
            {label: 'campo', type: 'result-column-campo'},
            {label: 'operador', type: 'result-column-operador'},
            {label: 'valor', type: 'result-column-valor'}
        ];
    rowRecipe.forEach(e => {
        let filterElement = document.createElement('div');
        filterElement.classList.add('filter');

        let labelElement = document.createElement('label');
        labelElement.innerHTML = e.label;

        let inputElement = document.createElement('input');
        inputElement.classList.add(e.type);
        inputElement.setAttribute('type', 'text');
        inputElement.disabled = true;
        
        switch(e.label){
            case 'campo':
                inputElement.value = campoValue
                break;
            case 'operador':
                inputElement.value = operadorValue;
                break;
            case 'valor':
                inputElement.setAttribute('type', valor.getAttribute('type') === null ? 'text' : valor.getAttribute('type') );
                inputElement.value = valor.value.length === 0 ? 'null' :
                    reportInputs.getValueTypeByCampoValue() === 'System.Decimal' ? getFixedDecimalValue(valor) : valor.value;
                break;
        }

        filterElement.appendChild(labelElement);
        filterElement.appendChild(inputElement);
        resultRow.appendChild(filterElement);
    } );

    let removeRowElement = document.createElement('div');
    removeRowElement.innerHTML = 'REMOVER';
    removeRowElement.classList.add('remove-filter-button');
    removeRowElement.addEventListener('click', () => {
        resultRow.remove();
        fixResultRowsIndex();
    } )
    resultRow.appendChild(removeRowElement);

    let filterRowsCount = document.getElementsByClassName('result-row').length;
    resultRow.setAttribute('row-index', filterRowsCount);

    return resultRow;
}

function fixResultRowsIndex(){
    let rows = Array.from(document.getElementsByClassName('result-row') );
    if(rows.length === 0)
        return;

    let lastIndex = 0;
    rows.forEach(r => {
        r.setAttribute('row-index', (lastIndex++).toString() );
    } );
}

function getFixedDateString(inputElement){
    if(inputElement.getAttribute('type') !== 'date')
        return inputElement.value;
    
    let result = `${inputElement.value[8]}${inputElement.value[9]}/` + 
    `${inputElement.value[5]}${inputElement.value[6]}/` +
    `${inputElement.value[0]}${inputElement.value[1]}${inputElement.value[2]}${inputElement.value[3]}`;

    return result;
}

function getFixedDecimalValue(inputElement){
    if(reportInputs.isNotANumber(inputElement.value) )
    {
        return '0,000';
    }

    let numberString = inputElement.value.replace(',', '.');
    if(numberString.includes('.') ){
        let dotIndex = numberString.indexOf('.');
        let dotIndexIncremented = dotIndex + 1;
        let floatingCount = numberString.length - dotIndexIncremented;
        while(floatingCount < 3)
        {
            numberString += '0';
            floatingCount++;
        }
        if(floatingCount > 3){
            let charsCountToRemove = floatingCount - 3;
            numberString = numberString.substring(0, numberString.length - charsCountToRemove);
        }

        return numberString.replace('.', ',');
    }

    return numberString + ',000';
}

function onResultCheckBoxCheck(){
    let output = '';
    resultInput.value = '';

    let accptedColumnsIndexes = [0, 3, 4, 5, 6, 7, 8];
    let higherColumnLength = [0, 0, 0, 0, 0, 0, 0];
    let rows = Array.from(result.getElementsByTagName('tbody')[0].getElementsByTagName('tr') );
    let stringRows = [];
    let getColumnLength = function(value){
        let length = 0;
        for(let i = 0; i < value.length; i++){
            if(value[i] === '\t'){
                length += 8;
                continue;
            }
            length++;
        }

        return length;
    }

    for(let i = 0; i < resultCheckBoxes.length; i++){
        resultCheckBoxesValues[i] = resultCheckBoxes[i].checked;
    }
    
    rows.forEach(row => {
        let columns = Array.from(row.children);
        // A cada linha, uma array será criada para armazenar o valor de cada coluna da linha atual.
        let line = [];

        for(let i = 0; i < accptedColumnsIndexes.length; i++){
            // A cada coluna, uma string será inserida na array line.
            line.push('');

            let lineIndex = line.lastIndexOf('');
            let subIndex = accptedColumnsIndexes[i];

            if(resultCheckBoxesValues[i] === false || decodeHtml(columns[subIndex].innerHTML).length === 0){
                line[lineIndex] += '\t';

                if(higherColumnLength[i] < getColumnLength(line[lineIndex] ) )
                    higherColumnLength[i] = getColumnLength(line[lineIndex] );

                continue;
            }         

            line[lineIndex] += decodeHtml(columns[subIndex].innerHTML);

            if(higherColumnLength[i] < getColumnLength(line[lineIndex] ) )
                higherColumnLength[i] = getColumnLength(line[lineIndex] );
        }

        // A array line é inserida em outra array.
        stringRows.push(line);
    } );
    
    // Agora precisamos fazer com que todas colunas tenham o mesmo tamanho que a coluna com maior tamanho (coluna correspondente).
    for(let i = 0; i < stringRows.length; i++){
        // stringRows[i] representa a linha da iteração atual.

        for(let j = 0; j < stringRows[i].length; j++){
            // stringRows[i][j] representa a coluna da iteração atual na linha stringRows[i].

            if(getColumnLength(stringRows[i][j] ) < higherColumnLength[j] ) {
                while((higherColumnLength[j] - getColumnLength(stringRows[i][j] ) ) >= 8 )
                    stringRows[i][j] += '        ';
                while(getColumnLength(stringRows[i][j] ) < higherColumnLength[j] )
                    stringRows[i][j] += ' ';
            }

            output += `${stringRows[i][j] }\t`;
        }
        
        // A cada iteração de linha, uma quebra de texto é inserida no resultado.
        output += i < stringRows.length - 1 ? '\n' : '';
    }

    resultInput.value = output;
    if(resultInput.classList.contains('result-output-changed') )
        resultInput.classList.remove('result-output-changed');

    // Timer para alterar a cor de fundo do output de resultado.
    setTimeout(() => resultInput.classList.add('result-output-changed'), 100);
}

function isValidResultCheckbox(element){
    let id = element.getAttribute('id')
    if(id === null)
        return false;

    if(id.includes('result-selector') === false)
        return false;

    if(element.getAttribute('type') !== 'checkbox')
        return false;

    return true;
}

function decodeHtml(htmlText){
    htmlText = `<html>${htmlText}</html>`;
    let parsedText = new DOMParser().parseFromString(htmlText, 'text/html').getElementsByTagName('html')[0].textContent;
    htmlText = `<html>${parsedText}</html>`;
    
    return new DOMParser().parseFromString(htmlText, 'text/html').getElementsByTagName('html')[0].textContent;
}

reportInputs.top.value = '100';
reportInputs.ano.value = new Date().getFullYear();