resultScreen = document.getElementById('resultscreen');
let result = "";

function keypress(button) {
    button.addEventListener('click', () => {
        const value = button.value;
        if (button.id === 'equalbtn') {
            result = `${eval(result)}`;
        } else if (button.id === 'clearbtn') {
            result = "";
        } else if (button.id === 'cancelbtn') {
            result = result.slice(0, -1);
        } else {
            dbl(button);
        }
        resultScreen.innerHTML = result;
    });
};

function dbl(buttons) {
    listbtn = ["+", "-", "*", "/"];
    if (buttons.value === ".") {
        if (hasDecimal(result)) {
            return;
        }
    }
    if (result.length > 0 && listbtn.includes(result[result.length - 1]) && listbtn.includes(buttons.value)) {
        result = result.replace(result[result.length - 1], buttons.value);
    } else {
        result += buttons.value;
    }
}

let one = document.getElementById('onebtn');
let two = document.getElementById('twobtn');
let three = document.getElementById('threebtn');
let four = document.getElementById('fourbtn');
let five = document.getElementById('fivebtn');
let six = document.getElementById('sixbtn');
let seven = document.getElementById('sevenbtn');
let eight = document.getElementById('eightbtn');
let nine = document.getElementById('ninebtn');
let zero = document.getElementById('zerobtn');
let plus = document.getElementById('plusbtn');
let equal = document.getElementById('equalbtn');
let minus = document.getElementById('minusbtn');
let multiply = document.getElementById('multiplybtn');
let divide = document.getElementById('dividebtn');
let point = document.getElementById('pointbtn');
let cancel = document.getElementById('cancelbtn');
let clear = document.getElementById('clearbtn');
let openb = document.getElementById('openbracket');
let closeb = document.getElementById('closebracket');

keypress(one);
keypress(two);
keypress(three);
keypress(four);
keypress(five);
keypress(six);
keypress(seven);
keypress(eight);
keypress(nine);
keypress(zero);
keypress(plus);
keypress(minus);
keypress(multiply);
keypress(divide);
keypress(openb);
keypress(closeb);
keypress(point);
keypress(equal);
keypress(cancel);
keypress(clear);

function hasDecimal(str) {
    const lastOperatorIndex = Math.max(str.lastIndexOf("+"), str.lastIndexOf("-"), str.lastIndexOf("*"), str.lastIndexOf("/"));
    const lastOperand = lastOperatorIndex === -1 ? str : str.substring(lastOperatorIndex + 1);
    return lastOperand.includes(".");
}

