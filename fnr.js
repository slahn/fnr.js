// Fnr.js 
// Validates "fødselsnummer", norwegian national identity number.
// (c) Sigmund L. Lahn 2014

(function(root) {
	var Fnr = root.Fnr = {};


	//The two checksum series
	//for digit 10, the first check digit
	var checksumSeries1 = [3, 7, 6, 1, 8, 9, 4, 5, 2, 1];
	//for digit 11, the 2nd check digit
	var checksumSeries2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 1];

	function sumDigits(numberString, checkSeries) {
		var digits = (numberString+'').split(''); //coerce to string, split into array of digits
		
		var sum = 0;
		for(var i = 0; i < checkSeries.length; ++i) {
			var d = parseInt(digits[i], 10);
			sum += d * checkSeries[i];
		}

		return sum;
	}


	function validateChecksum(number, series) {
		// validates the number against the checksum series		
		// multiplies each digit by the corresponding number in the series, and sums the results
		// the number is valid if the sum is divisible by 11

		// Can be used for both checksum digits (digits 10 and 11), when the correct series is supplied

		var sum = sumDigits(number, series);
		return sum % 11 === 0;
	}

	//extracts correct DOB from person number.
	//accounts for D-numbers and H-numbers
	function findDateOfBirth(number) {
		var dobstr = (number+'').substring(0,6); //coerce to string, take date digits
		var first = dobstr.charAt(0);
		
		// A cross-institution H-number (FH-number) starts with 8 or 9.
		// We can't really find the DOB from this number, so we won't try.
		// These numbers really shouldn't be used.
		// Return invalid for now.
		if(first == '8' || first == '9') {
			return {
				valid: false,
				error: "FH-numbers are not supported yeat.",
				type: 'FH',
				dateOfBirth: null
			};
		}

		//default, 'normal' type.
		var type = 'N';
		var dob = null;
		
		var day = parseInt(dobstr.substring(0,2), 10);
		var month = parseInt(dobstr.substring(2,4), 10);
		var year = parseInt(dobstr.substring(4), 10);
		var century = parseInt(number.substring(6, 9), 10);

		if(day > 40) {
			type = 'D';
			day = day - 40;
		}
		if(month > 40) {
			type = 'H';
			month = month - 40;
		}

		//Connection between year and 3 last digits in number
		//a) … 1854-1899, uses 749-500,
		//b) … 1900-1999, uses 499-000,
		//c) … 1940-1999, also uses 999-900
		//d) … 2000-2039, uses 999-500.

		//Rule A
		if(year >= 54 && century >= 500 && century < 750) {
			year = 1800 + year;
		}
		// rule B
		else if(century < 500) {
			year = 1900 + year;
		}
		// Rule C
		else if(century >= 900 && year >= 40) {
			year = 1900 + year;
		} 
		//Rule D
		else if(year < 40 && century >= 500) {
			year = 2000 + year;
		}

		else {
			return {
				valid: false,
				dateOfBirth: null,
				error: 'Year/century code mismatch. Year: '+year+', century: '+century
			}
		}
		

		// javascript months go from 0 to 11, not 1 to 12.
		dob = new Date(Date.UTC(year, month-1, day));

		return {
			valid: true,
			type: type,
			dateOfBirth: dob
		}
	}

	//returns 'M' / 'F' based on the 8th digit in the person number.
	//Odd means male, even means female.
	function findSex(number) {
		var sexdigit = parseInt(number.charAt(8), 10);

		return (sexdigit % 2 === 0) ? 'F' : 'M';
	}


	Fnr.info = function(number) {
		if(number.length != 11) {
			return {
				valid: false,
				error: "Invalid length - not 11 digits."
			};
		}

		if(!/^\d{11}$/.test(number)) {
			return {
				valid: false,
				error: "Invalid format - not 11 digits."
			};
		}

		var valid1 = validateChecksum(number, checksumSeries1);
		var valid2 = validateChecksum(number, checksumSeries2);

		if(!(valid1 && valid2)) {
			return {
				valid: false,
				error: "Invalid checksum.",	
				checksum1: valid1,
				checksum2: valid2
			};
		}

		var sex = findSex(number);
		var dob = findDateOfBirth(number);		
		if(!dob.valid) {
			return {
				valid: false,
				error: dob.error
			};
		}		

		return {
			valid: true,
			sex: sex,
			dateOfBirth: dob.dateOfBirth,
			type: dob.type
		};
	}

	Fnr.validate = function(number) {		
		return Fnr.info(number).valid;
	}

	Fnr.generateControlDigits = function(number) {

		//To find the control digit, run the series with 0 as the missing control digit.
		//If the remainder of the sum % 11 is 0, then 0 is the digit. Otherwise, the digit is 11 - (sum % 11)
		//Do this for both checksum series.

		var allSeries = [checksumSeries1, checksumSeries2];

		for(var i = 0; i < allSeries.length; ++i) {	
			var series = allSeries[i];

			var numberWithPlaceholderCheck = (number+'') + '0';
			var sum = sumDigits(numberWithPlaceholderCheck, series);
			var rem = sum % 11;
			var digit = 0;
			
			if(rem == 10) {
				//this number is not valid!
				return null;
			} else if(rem == 0) {
				digit = 0;
			} else {
				digit = 11 - rem;
			}
			number = (number+'') + (digit+'');
		}
		
		return number;
	};

	Fnr.generateRandom = function(type, sex) {
		if(!type) {
			type = "N";
		}

		if(!sex) {
			sex = (Math.random() >= 0.5) ? "M" : "F";
		}


		// Find a random date after 1900
		var today = new Date();
		var thisYear = today.getFullYear();

		var year = Math.floor(Math.random() * (thisYear-1900)) + 1900;
		var day = Math.floor(Math.random()*365)+1;

		var birthDate = new Date(year,0,0);
		birthDate.setDate(day);

		var dateParts = [
			padNumber(birthDate.getDate(), 2),
			padNumber(birthDate.getMonth() + 1, 2),
			(birthDate.getFullYear()+'').substring(2)
			];

		if(type == "D") {
			dateParts[0] = padNumber(birthDate.getDate() + 40, 2);
		} else if(type == "H") {
			dateParts[1] = padNumber(birthDate.getMonth() + 41, 2);
		}

		var dateString = dateParts.join('');

		var fnr = null;		
		var tries = 0;
		while(fnr == null && tries < 10000000) {
			//random personal num in range 000-999
			var num = Math.floor(Math.random() * 1000);
			fnr = Fnr.generateControlDigits(dateString + padNumber(num +'', 3));
			if(fnr != null && !Fnr.validate(fnr)) {
				fnr = null;
			}
			tries++;
		}

		return fnr;
	};

	function padNumber(num, length) {
		var zeros = (new Array(length+1).join("0"));
		var s = zeros + num;
		return s.substring(s.length-length);
	}

})(this);