fnr.js
====================================

fnr.js validates "fødselsnummer", the norwegian national identity number.
It can also generate random, valid identity numbers for testing purposes.

Example usage:

```
var nin = "....some NiN...";

// you can either validate a number...
if(!Fnr.validate(nin)) {
	alert("Invalid nin!");
}

// or extract information

var data = Fnr.info(nin);
var isValid = data.valid;
if(!isValid) {
	alert("Invalid nin: "+data.error);
}

var dob = data.dateOfBirth;
var sex = data.sex; // 'M' or 'F'
var ninType = data.type; // 'N', 'D' or 'H', for normal, 'D-number' or 'H-number' respectively.

```

 See fnr.html for more, including generation of random identity numbers.