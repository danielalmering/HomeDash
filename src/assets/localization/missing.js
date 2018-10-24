const de = require('./de.json');
const en = require('./en.json');
const nl = require('./nl.json');

//check if all keys that are present in nl are present everywhere
nlkeys = allKeys(nl);
dekeys = allKeys(de);
enkeys = allKeys(en);

console.log(`add to DE:`);
console.log( subtract(dekeys, nlkeys) );

console.log(`add to EN:`);
console.log( subtract(enkeys, nlkeys) );

function keys(obj){
    var result = [];
    for(var prop in obj){
        result.push(prop);
    }
    return result;
}

function allKeys(forObject, path){
    var result = [];
    if (path){
        path += ".";
    } else {
        path = "";
    }
    
    keys(forObject).forEach( key =>{
        result.push( path + key );
        if (typeof forObject[key] == "object"){
            result = result.concat( allKeys(forObject[key], path + key ) );
        }
    }) 
    
    return result;
}

//returns everything that occurs in from, but not in what
function subtract(what, from, identical=null){
    if (!identical){
        identical = (a, b)=>a===b;
    }

    var result = [];
    from.forEach( maybe =>{
        if ( !what.find( certain => identical(maybe, certain) ) ){
            result.push( maybe );
        }
    });

    return result;
}
