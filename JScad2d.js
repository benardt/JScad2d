/*\
        Function for 2D cad drawing
        
        
       
        Author: Thierry Bénard
        Date: 29 Sep 2017


\*/

var NSSVG = 'http://www.w3.org/2000/svg';

// --------------------------------------------------
// object descriptor: Point
// --------------------------------------------------
function Point(x, y, r) {
	"use strict";
	this.x = x;
	this.y = y;
	this.r = r;
}



//---------------------------------------------------------------------------------------
// Calculator parser: string --> value
// Replace a string formula with value of formula result
//---------------------------------------------------------------------------------------
function mathEval(exp) {
	"use strict";
	var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
		valid = true,
		myVar;

	// Detect valid JS identifier names and replace them
	myVar = exp.replace(reg, function($0) {
		// If the name is a direct member of Math, allow
		if (Math.hasOwnProperty($0)) {
			return "Math." + $0;
		} else {
			// Otherwise the expression is invalid
			valid = false;
		}
	});

	// Don't eval if our replace function flagged as invalid
	if (!valid) {
		return "Invalid arithmetic expression";
	} else {
		try {
			return eval(myVar);
		} catch (e) {
			return "Invalid arithmetic expression";
		}
	}
}

// ------------------------------------------------
// function: do de-parametrization
// replace all parameters by the right number value
// input : objet = the Object json file
// ------------------------------------------------
function doDeparam(objet) {
	"use strict";

	var i,
		param = [],
		propr,
		noview,
		noshape,
		noline,
		noprop,
		reg,
		currshapes,
		currlines;

	// place all object parameters in a table
	// check if Parameters in object exist before

	for (propr in objet.Parameters) {
		if (objet.Parameters.hasOwnProperty(propr)) {
			param.push(propr);
		}
	}

	// Attention le remplacement ne fonctionne pas toujours
	// quand le nom d'un paramètre est inclu dans le nom d'un autre

	// 1st replace string (parameter) by number (value)
	// all views
	for (noview = 0; noview <= objet.Views.length - 1; noview += 1) {
		currshapes = objet.Views[noview].Shapes;
		// all shapes of current view
		for (noshape = 0; noshape <= currshapes.length - 1; noshape += 1) {
			// all points of current shape of current view
			for (i = 0; i <= currshapes[noshape].Points.length - 1; i += 1) {
				if (typeof currshapes[noshape].Points[i].x === 'string' || currshapes[noshape].Points[i].x instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currshapes[noshape].Points[i].x = currshapes[noshape].Points[i].x.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if
				if (typeof currshapes[noshape].Points[i].y === 'string' || currshapes[noshape].Points[i].y instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currshapes[noshape].Points[i].y = currshapes[noshape].Points[i].y.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if
				if (typeof currshapes[noshape].Points[i].r === 'string' || currshapes[noshape].Points[i].r instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currshapes[noshape].Points[i].r = currshapes[noshape].Points[i].r.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if
				if (typeof currshapes[noshape].Points[i].length === 'string' || currshapes[noshape].Points[i].length instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currshapes[noshape].Points[i].length = currshapes[noshape].Points[i].length.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if
			} // for
		} // for

		// First check if Views include Lines
		if (typeof objet.Views[noview].Lines !== "undefined") {
			currlines = objet.Views[noview].Lines;
			for (noline = 0; noline <= currlines.length - 1; noline += 1) {
				// Check if string to deparametrized is realyy a string
				// if not it is a number so nothing to do
				if (typeof currlines[noline].Start.x === 'string' || currlines[noline].Start.x instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currlines[noline].Start.x = currlines[noline].Start.x.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if 
				if (typeof currlines[noline].Start.y === 'string' || currlines[noline].Start.y instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currlines[noline].Start.y = currlines[noline].Start.y.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if 
				if (typeof currlines[noline].End.x === 'string' || currlines[noline].End.x instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currlines[noline].End.x = currlines[noline].End.x.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if 
				if (typeof currlines[noline].End.y === 'string' || currlines[noline].End.y instanceof String) {
					for (noprop = 0; noprop <= param.length - 1; noprop += 1) {
						reg = new RegExp(param[noprop], "g");
						currlines[noline].End.y = currlines[noline].End.y.replace(reg, " " + objet.Parameters[param[noprop]]);
					} // for
				} // if 
			} // for no line
		}

	} // for

	// 2nd evaluate formula
	for (noview = 0; noview <= objet.Views.length - 1; noview += 1) {
		currshapes = objet.Views[noview].Shapes;
		for (noshape = 0; noshape <= currshapes.length - 1; noshape += 1) {
			for (i = 0; i <= currshapes[noshape].Points.length - 1; i += 1) {
				currshapes[noshape].Points[i].x = mathEval("(" + currshapes[noshape].Points[i].x + ")");
				currshapes[noshape].Points[i].y = mathEval("(" + currshapes[noshape].Points[i].y + ")");

				if (currshapes[noshape].Points[i].r !== null) {
					currshapes[noshape].Points[i].r = mathEval("(" + currshapes[noshape].Points[i].r + ")");
				} // if

				if (currshapes[noshape].Points[i].length !== null) {
					currshapes[noshape].Points[i].length = mathEval("(" + currshapes[noshape].Points[i].length + ")");
				} // if

			} // for
		} // for
	} // for

	return objet;
}




/**
 * Calculate cartesian from polar coordinates
 * 
 * <p>
 * This is the 'length' property which identify
 * polar from cartesian.
 * If 'length' different of null then polar,
 * if 'length' equal to null then cartesian.
 * </p>
 * 
 * @param {object} the object file with all data
 * 
 */
function doCoordonate(objet) {
	"use strict";

	var noview,
		currshapes,
		noshape,
		nopoint,
		PIDEGREE = 180.0;

	// all views
	for (noview = 0; noview <= objet.Views.length - 1; noview += 1) {
		currshapes = objet.Views[noview].Shapes;

		// all shapes of current view
		for (noshape = 0; noshape <= currshapes.length - 1; noshape += 1) {
			// all points of current shape of current view
			// do not start at point #0 because need a first reference
			for (nopoint = 1; nopoint <= currshapes[noshape].Points.length - 1; nopoint += 1) {
				// First check if current Point include length parameter & angle parameter

				if (typeof currshapes[noshape].Points[nopoint].length !== "undefined" && typeof currshapes[noshape].Points[nopoint].angle !== "undefined") {
					if (currshapes[noshape].Points[nopoint].length !== null && currshapes[noshape].Points[nopoint].angle !== null) {
						currshapes[noshape].Points[nopoint].x = currshapes[noshape].Points[nopoint - 1].x +
							currshapes[noshape].Points[nopoint].length * Math.cos(currshapes[noshape].Points[nopoint].angle * Math.PI / PIDEGREE);
						currshapes[noshape].Points[nopoint].y = currshapes[noshape].Points[nopoint - 1].y +
							currshapes[noshape].Points[nopoint].length * Math.sin(currshapes[noshape].Points[nopoint].angle * Math.PI / PIDEGREE);

					} // if
				} // if
			} // for
		} // for
	} // for

	return objet;
}

// --------------------------------------------------
// Function
// Return the length of string in pixels
// --------------------------------------------------
function getWidthString(the_text_that_you_want_to_measure, fontsize, fontname) {
	"use strict";

	var c,
		ctx,
		metric;
	c = document.createElement('canvas'); // Create a dummy canvas (render invisible with css)

	ctx = c.getContext('2d'); // Get the context of the dummy canvas
	// Set the context.font to the font that you are using
	ctx.font = fontsize + 'px' + fontname;
	// Measure the string 
	metric = ctx.measureText(the_text_that_you_want_to_measure);
	return metric.width;
}



/**
 * Draw lines
 * 
 * <p>Draw a line</p>
 * 
 * @param {} svgelem
 * @param {object} objet
 */
function drawLine(noview, svgelem, myObject) {
	"use strict";

	var noline = 0,
		myViewid,
		currview = {},
		scale = 1,
		myLine, // element of DOM Document Object Model
		myLineStyle = [];

	myLineStyle = ['center line', 'dashed'];

	scale = myObject.Header.Scale;

	currview = myObject.Views[noview];
	if (typeof myObject.Views[noview].Lines !== "undefined") { // Checking mandatory if not bug !!!!
		for (noline = 0; noline <= currview.Lines.length - 1; noline += 1) {

			myLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

			myLine.setAttribute("x1", scale * (currview.Header.Origine.x + currview.Lines[noline].Start.x));
			myLine.setAttribute("y1", scale * (currview.Header.Origine.y - currview.Lines[noline].Start.y));

			myLine.setAttribute("x2", scale * (currview.Header.Origine.x + currview.Lines[noline].End.x));
			myLine.setAttribute("y2", scale * (currview.Header.Origine.y - currview.Lines[noline].End.y));

			// Define line style:
			// center line: Done
			// dashet line: To do
			if (currview.Lines[noline].Stroke === myLineStyle[0]) {
				myLine.setAttribute("stroke", "#999");
				myLine.setAttribute("stroke-dasharray", "25,6,8,6");
			} else if (currview.Lines[noline].Stroke === myLineStyle[1]) {
				myLine.setAttribute("stroke", "#000");
				myLine.setAttribute("stroke-dasharray", "8,6");
			} else {
				myLine.setAttribute("stroke", "#000");
			}
			myLine.setAttribute("stroke-width", 0.75);
			myViewid = "view" + noview;
			svgelem.getElementById(myViewid).appendChild(myLine);
		} // for
	} //if


	return 0;
}



/**
 * draw one shape
 * 
 * <p>
 * - return a path inside a <g></g> tag
 * - draw texture according to texture variable (hatch or not)
 * - according to 'affichage' variable add or not squeleton
 * </p>
 * 
 * @param {} ...
 * @param {number} affichage
 * 						1: squeleton without fillet and normal shape
 * 						2: sqeleton for fillet only
 * 						other: normal shape only
 * @return {string} 'svg shape <g><path .... / ></g>'
 */
function Shape() {
	"use strict";
	var i,
		mydattr = "",
		myText = "",
		pts = arguments[1], // points du squelette de la forme pleine
		scale = arguments[2], // échelle de l'affichage
		ori = arguments[3], // origine du dessin
		texture = arguments[4], // texture
		noview = arguments[5], // view # for hatch pattern
		format = arguments[6], // format
		thesvgelem = arguments[7],

		p = [], // number of previous point
		s = [], // number of next point

		angle = [], // angle value at each point
		ax, // A: previous point
		ay,
		bx, // B: next point
		by,

		l = [], // Length between point and start & end point of fillet

		pr = [],
		su = [],
		m,
		n,
		KAPPA = 0.5522847498;
		
	var myView = "view" + noview;
	var mySvg = thesvgelem.getElementById(myView);

	// find number for previous and next point
	// p is number of previous point
	// s is number of next point
	for (i = 0; i <= pts.length - 1; i += 1) {
		p[i] = (i - 1 + pts.length) % pts.length;
		s[i] = (i + 1) % pts.length;
	}

	// Find angle at each point
	for (i = 0; i <= pts.length - 1; i += 1) {
		ax = pts[p[i]].x - pts[i].x;
		ay = pts[p[i]].y - pts[i].y;
		bx = pts[s[i]].x - pts[i].x;
		by = pts[s[i]].y - pts[i].y;
		// arccosinus du produit scalaire sur le produit des normes
		angle[i] = Math.acos((ax * bx + ay * by) /
			(Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by)));
	}

	// Calculate length (pour positionner les 2 pts "précédent" et "suivant")
	for (i = 0; i <= pts.length - 1; i += 1) {
		// do only if radius exist
		if (pts[i].r !== null) {
			l[i] = pts[i].r / Math.tan(angle[i] / 2.0);
		}
	}

	// Calcul des coordonnées des points "précédent" et "suivant".
	// Ce sont les points qui débutent et ferment le 'fillet'
	// (x2, y2) = current point, (x1, y1) = previous or next point

	// Line segment division (split)
	// coordinates of the point R are ((mx2 + nx1)/(m + n), (my 2 + ny1)/(m + n))
	// the point R divides the line-segment internally in a given ratio m : n

	// For fillet (circle) ratio is find from kappa parameter

	for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			// for previous
			ax = pts[p[i]].x - pts[i].x;
			ay = pts[p[i]].y - pts[i].y;

			n = l[i];
			m = Math.sqrt(ax * ax + ay * ay) - n;

			pr[2 * i] = new Point((m * pts[i].x + n * pts[p[i]].x) / (m + n),
				(m * pts[i].y + n * pts[p[i]].y) / (m + n), null);

			n = l[i] - pts[i].r * KAPPA;
			m = Math.sqrt(ax * ax + ay * ay) - n;
			pr[2 * i + 1] = new Point((m * pts[i].x + n * pts[p[i]].x) / (m + n),
				(m * pts[i].y + n * pts[p[i]].y) / (m + n), null);

			// for next
			bx = pts[s[i]].x - pts[i].x;
			by = pts[s[i]].y - pts[i].y;

			n = l[i];
			m = Math.sqrt(bx * bx + by * by) - n;
			su[2 * i] = new Point((m * pts[i].x + n * pts[s[i]].x) / (m + n),
				(m * pts[i].y + n * pts[s[i]].y) / (m + n), null);

			n = l[i] - pts[i].r * KAPPA;
			m = Math.sqrt(bx * bx + by * by) - n;
			su[2 * i + 1] = new Point((m * pts[i].x + n * pts[s[i]].x) / (m + n),
				(m * pts[i].y + n * pts[s[i]].y) / (m + n), null);
		}
	}

	// shape with fillet
	var gobj = [],
		gname = ['basicshape', 'squeleton', 'ptsfillet', 'squeletontext', 'centerfillet'];
	
	for (i = 0; i <= gname.length - 1; i += 1) {
		gobj.push(document.createElementNS(NSSVG, 'g'));
		gobj[gobj.length - 1].setAttributeNS (null, 'class', gname[gobj.length - 1]);
		mySvg.appendChild (gobj[gobj.length - 1]);
	}

	mydattr = "M";
	for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			mydattr += (scale * (ori.x + pr[2 * i].x)) + "," +
				(scale * (ori.y - pr[2 * i].y)) + " C" +
				(scale * (ori.x + pr[2 * i + 1].x)) + "," +
				(scale * (ori.y - pr[2 * i + 1].y)) + " " +
				(scale * (ori.x + su[2 * i + 1].x)) + "," +
				(scale * (ori.y - su[2 * i + 1].y)) + " " +
				(scale * (ori.x + su[2 * i].x)) + "," +
				(scale * (ori.y - su[2 * i].y)) + " L";
		} else {
			mydattr += (scale * (ori.x + pts[i].x)) + "," + (scale * (ori.y - pts[i].y)) + " L";
		}
	}
	// remove the last " L" because they are no new point.
	mydattr = mydattr.substring(0, mydattr.length - 2);
	mydattr += "z";
	myText += mydattr;

	// texture de la forme
	if (texture === "hatch") {
		var myFill = 'url(#diagonalHatch' + 'View' + noview + ')';
		//myText += "\" fill=\"url(#diagonalHatch" + "View" + noview + ")\" stroke=\"black\" stroke-width=\"2\" /></g>";
	} else {
		//myText += "\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" /></g>";
		myFill = 'white';
	}
	
	var path = document.createElementNS(NSSVG, 'path');
	path.setAttributeNS (null, 'd', mydattr);
	path.setAttributeNS (null, 'fill', myFill);
	path.setAttributeNS (null, 'stroke', 'black');
	path.setAttributeNS (null, 'stroke-width', 2);
	gobj[0].appendChild (path);
	
	// print squeleton in red

	// courbe d'origine sans les fillet pour le debug
	//ttexte += "<g class=\"squeleton\"><path d=\"M";
	mydattr = "M";
	for (i = 0; i <= pts.length - 1; i += 1) {
		mydattr += " " + (scale * (ori.x + pts[i].x)) + " " + (scale * (ori.y - pts[i].y)) + " L";
	}
	mydattr = mydattr.substring(0, mydattr.length - 2);
	mydattr += "z";
	
	var path1 = document.createElementNS(NSSVG, 'path');
	path1.setAttributeNS (null, 'd', mydattr);
	path1.setAttributeNS (null, 'fill', 'white');
	path1.setAttributeNS (null, 'fill-opacity', 0.25);
	path1.setAttributeNS (null, 'stroke', 'red');
	path1.setAttributeNS (null, 'stroke-width', 1);
	gobj[1].appendChild (path1);
	
	// Print key points of shape (squeleton) class = squeletontext
	var texte = [];
	var len = 0;
	// Affiche les numéros de chaque point
	for (i = 0; i <= pts.length - 1; i += 1) {
		texte.push(document.createElementNS(NSSVG, 'text'));
		len = texte.length - 1;
		texte[len].setAttributeNS (null, 'x', scale * (ori.x + pts[i].x));
		texte[len].setAttributeNS (null, 'y', scale * (ori.y - pts[i].y));
		texte[len].setAttributeNS (null, 'fill', 'red');
		texte[len].setAttributeNS (null, 'font-size', format.font_size);
		texte[len].innerHTML = i;
		gobj[3].appendChild (texte[len]);
	}
	



	// Print key points of fillet (squeleton) class=ptsfillet
	// class allow to print or not with .style.visibility property
	var cercle = [];
	len = 0;

	for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			cercle.push(document.createElementNS(NSSVG, 'circle'));
			len = cercle.length - 1;
			cercle[len].setAttributeNS (null, 'cx', scale * (ori.x + pr[2 * i].x));
			cercle[len].setAttributeNS (null, 'cy', scale * (ori.y - pr[2 * i].y));
			cercle[len].setAttributeNS (null, 'r', 3);
			cercle[len].setAttributeNS (null, 'stroke-width', 0);
			cercle[len].setAttributeNS (null, 'fill', 'yellow');
			gobj[2].appendChild (cercle[len]);
			
			cercle.push(document.createElementNS(NSSVG, 'circle'));
			len = cercle.length - 1;
			cercle[len].setAttributeNS (null, 'cx', scale * (ori.x + pr[2 * i + 1].x));
			cercle[len].setAttributeNS (null, 'cy', scale * (ori.y - pr[2 * i + 1].y));
			cercle[len].setAttributeNS (null, 'r', 3);
			cercle[len].setAttributeNS (null, 'stroke-width', 0);
			cercle[len].setAttributeNS (null, 'fill', 'green');
			gobj[2].appendChild (cercle[len]);
			
			cercle.push(document.createElementNS(NSSVG, 'circle'));
			len = cercle.length - 1;
			cercle[len].setAttributeNS (null, 'cx', scale * (ori.x + su[2 * i].x));
			cercle[len].setAttributeNS (null, 'cy', scale * (ori.y - su[2 * i].y));
			cercle[len].setAttributeNS (null, 'r', 3);
			cercle[len].setAttributeNS (null, 'stroke-width', 0);
			cercle[len].setAttributeNS (null, 'fill', 'yellow');
			gobj[2].appendChild (cercle[len]);
			
			cercle.push(document.createElementNS(NSSVG, 'circle'));
			len = cercle.length - 1;
			cercle[len].setAttributeNS (null, 'cx', scale * (ori.x + su[2 * i + 1].x));
			cercle[len].setAttributeNS (null, 'cy', scale * (ori.y - su[2 * i + 1].y));
			cercle[len].setAttributeNS (null, 'r', 3);
			cercle[len].setAttributeNS (null, 'stroke-width', 0);
			cercle[len].setAttributeNS (null, 'fill', 'green');
			gobj[2].appendChild (cercle[len]);
			
		}
	}


	// Print center of fillet (in red)

	var ca, cb,
		x0, x1, y0, y1, x2, y2, x3, y3, x4, y4;
		
	// x0 and y0 are temporary variable
	// L1 (x1, y1) and (x2, y2)
	// L2 (x3, y3) and (x4, y4)
	// Algorithm for intersection is here:
	// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
	// 'Given two points on each line'

	for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			
			// rotation du point de base autour du point de départ du congé de 90°
			// 1. changement de repère
			x0 = pts[i].x - pr[2 * i].x;
			y0 = pts[i].y - pr[2 * i].y;
			// 2. rotation de 90°
			x2 = -y0;
			y2 = x0;
			// 3. changement de repère inverse
			x2 = x2 + pr[2 * i].x;
			y2 = y2 + pr[2 * i].y;

			// rotation du point de base autour du point de fin du congé de 90°
			// 1. changement de repèe
			x0 = pts[i].x - su[2 * i].x;
			y0 = pts[i].y - su[2 * i].y;
			// 2. rotation de 90°
			x3 = -y0;
			y3 = x0;
			// 3. changement de repère inverse
			x3 = x3 + su[2 * i].x;
			y3 = y3 + su[2 * i].y;

			x1 = pr[2 * i].x;
			y1 = pr[2 * i].y;

			x4 = su[2 * i].x;
			y4 = su[2 * i].y;
			
			var coeff = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
			ca = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / coeff;
			cb = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / coeff;
			
			cercle.push(document.createElementNS(NSSVG, 'circle'));
			len = cercle.length - 1;
			cercle[len].setAttributeNS (null, 'cx', scale * (ori.x + ca));
			cercle[len].setAttributeNS (null, 'cy', scale * (ori.y - cb));
			cercle[len].setAttributeNS (null, 'r', 3);
			cercle[len].setAttributeNS (null, 'stroke-width', 0);
			cercle[len].setAttributeNS (null, 'fill', 'red');
			gobj[4].appendChild (cercle[len]);
		}
	} // end for


	return 0;
}


//--------------------------------------------------------------------------------------------
// Draw dimension
// input:
//         objet: all data in object form
//         dim  : objet of no of dimension to draw
//--------------------------------------------------------------------------------------------
function drawDimension(theSvgElement, objet, dim) {
	"use strict";
	var eloignement = 5, // length in pixel between shape and attach line
		longueur = dim.FreeSpace, // length in pixel between dimension line and shape

		PtStart = objet.Views[dim.PtStart.View].Shapes[dim.PtStart.Shape].Points[dim.PtStart.Point],
		PtEnd = objet.Views[dim.PtEnd.View].Shapes[dim.PtEnd.Shape].Points[dim.PtEnd.Point],
		Ori = objet.Views[dim.PtStart.View].Header.Origine,
		scale = objet.Header.Scale,

		maxy,
		maxx, // needed to dimension location
		stringtoprint, // text to print
		prefix, // value to print before dimension value (R or diameter symbol)
		sens, // side to draw dimension up or down / left or right

		line1,
		line2,
		line3,
		line4,
		text1,
		textheight = 8;

	switch (dim.Sens) {
		case "top":
			sens = 1;
			break;
		case "bottom":
			sens = -1;
			break;
		case "left":
			sens = -1;
			break;
		case "right":
			sens = 1;
			break;
	} // switch

	// Add a prefix (ie diamter symbol or R for radius) to dimension
	prefix = "";
	if (typeof dim.Prefix !== "undefined") {
		if (dim.Prefix === "diameter") {
			prefix = "\u2300" + " ";
		} else if (dim.Prefix === "radius") {
			prefix = "R" + " ";
		} else {
			prefix = "";
		}
	}


	if (dim.Direction === "vertical") {

		// text
		stringtoprint = prefix + Math.abs(PtEnd.y - PtStart.y);

		// 1st calculate the max between starting point and ending point of dimension
		maxx = Math.max(scale * PtStart.x + sens * longueur, scale * PtEnd.x + sens * longueur);

		// lignes d'attache (Start side)
		line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line1.setAttribute("x1", scale * (Ori.x + PtStart.x) + sens * eloignement);
		line1.setAttribute("y1", scale * (Ori.y - PtStart.y));
		line1.setAttribute("x2", scale * (Ori.x) + maxx);
		line1.setAttribute("y2", scale * (Ori.y - PtStart.y));
		line1.setAttribute("stroke", objet.Format.Dimensions_color);
		theSvgElement.getElementById("dimension").appendChild(line1);

		// lignes d'attache (End side)
		line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line2.setAttribute("x1", scale * (Ori.x + PtEnd.x) + sens * eloignement);
		line2.setAttribute("y1", scale * (Ori.y - PtEnd.y));
		line2.setAttribute("x2", scale * (Ori.x) + maxx);
		line2.setAttribute("y2", scale * (Ori.y - PtEnd.y));
		line2.setAttribute("stroke", objet.Format.Dimensions_color);
		theSvgElement.getElementById("dimension").appendChild(line2);

		// Global line start
		line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line3.setAttribute("x1", scale * (Ori.x) + (maxx - sens * eloignement));
		line3.setAttribute("y1", scale * (Ori.y - PtStart.y));
		line3.setAttribute("x2", scale * (Ori.x) + (maxx - sens * eloignement));
		line3.setAttribute("y2", scale * (Ori.y - PtStart.y - 0.5 * (PtEnd.y - PtStart.y)) - Number(textheight));
		line3.setAttribute("stroke", objet.Format.Dimensions_color);
		line3.setAttribute('marker-start', 'url(#markerArrowStart)');
		//line3.setAttribute('marker-end', 'url(#markerArrowEnd)');
		theSvgElement.getElementById("dimension").appendChild(line3);

		// Global line end
		line4 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line4.setAttribute("x1", scale * (Ori.x) + (maxx - sens * eloignement));
		line4.setAttribute("y1", scale * (Ori.y - PtStart.y - 0.5 * (PtEnd.y - PtStart.y)) + Number(textheight));
		line4.setAttribute("x2", scale * (Ori.x) + (maxx - sens * eloignement));
		line4.setAttribute("y2", scale * (Ori.y - PtEnd.y));
		line4.setAttribute("stroke", objet.Format.Dimensions_color);
		//line4.setAttribute('marker-start', 'url(#markerArrowStart)');
		line4.setAttribute('marker-end', 'url(#markerArrowEnd)');
		theSvgElement.getElementById("dimension").appendChild(line4);

		// text
		text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
		// need some special formula to take into account the height of font
		text1.setAttribute("x", scale * Ori.x + (maxx - sens * eloignement) - 0.5 * objet.Format.font_size * (0.35146 / 25.4) * 96);
		text1.setAttribute("text-anchor", "middle");
		text1.setAttribute("style", "writing-mode: tb;");
		text1.setAttribute("y", scale * (Ori.y - (PtStart.y + PtEnd.y) / 2));
		text1.setAttribute("fill", objet.Format.Dimensions_color);
		text1.setAttribute("font-size", objet.Format.font_size);
		text1.textContent = stringtoprint;
		theSvgElement.getElementById("dimension").appendChild(text1);

	} else if (dim.Direction === "horizontal") {

		// text
		stringtoprint = prefix + Math.abs(PtEnd.x - PtStart.x);

		maxy = Math.max(scale * PtStart.y + sens * longueur, scale * PtEnd.y + sens * longueur);

		// lignes d'attache (Start side)
		line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line1.setAttribute("x1", scale * (Ori.x + PtStart.x));
		line1.setAttribute("y1", scale * (Ori.y - PtStart.y) - sens * eloignement);
		line1.setAttribute("x2", scale * (Ori.x + PtStart.x));
		line1.setAttribute("y2", scale * (Ori.y) - maxy);
		line1.setAttribute("stroke", objet.Format.Dimensions_color);
		theSvgElement.getElementById("dimension").appendChild(line1);

		// lignes d'attache (End side)
		line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line2.setAttribute("x1", scale * (Ori.x + PtEnd.x));
		line2.setAttribute("y1", scale * (Ori.y - PtEnd.y) - sens * eloignement);
		line2.setAttribute("x2", scale * (Ori.x + PtEnd.x));
		line2.setAttribute("y2", scale * (Ori.y) - maxy);
		line2.setAttribute("stroke", objet.Format.Dimensions_color);
		theSvgElement.getElementById("dimension").appendChild(line2);

		// Global line start
		line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line3.setAttribute("x1", scale * (Ori.x + PtStart.x));
		line3.setAttribute("y1", scale * (Ori.y) - (maxy - sens * eloignement));
		line3.setAttribute("x2", scale * (Ori.x + PtStart.x + 0.5 * (PtEnd.x - PtStart.x)) - 0.5 * getWidthString(stringtoprint, objet.Format.font_size, "Helvetica"));
		line3.setAttribute("y2", scale * (Ori.y) - (maxy - sens * eloignement));
		line3.setAttribute("stroke", objet.Format.Dimensions_color);
		line3.setAttribute('marker-start', 'url(#markerArrowStart)');
		//line3.setAttribute('marker-end', 'url(#markerArrowEnd)');
		theSvgElement.getElementById("dimension").appendChild(line3);

		// Global line end
		line4 = document.createElementNS("http://www.w3.org/2000/svg", "line");
		line4.setAttribute("x1", scale * (Ori.x + PtStart.x + 0.5 * (PtEnd.x - PtStart.x)) + 0.5 * getWidthString(stringtoprint, objet.Format.font_size, "Helvetica"));
		line4.setAttribute("y1", scale * (Ori.y) - (maxy - sens * eloignement));
		line4.setAttribute("x2", scale * (Ori.x + PtEnd.x));
		line4.setAttribute("y2", scale * (Ori.y) - (maxy - sens * eloignement));
		line4.setAttribute("stroke", objet.Format.Dimensions_color);
		//line4.setAttribute('marker-start', 'url(#markerArrowStart)');
		line4.setAttribute('marker-end', 'url(#markerArrowEnd)');
		theSvgElement.getElementById("dimension").appendChild(line4);

		// text
		text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text1.setAttribute("x", scale * (Ori.x + (PtStart.x + PtEnd.x) / 2));
		text1.setAttribute("text-anchor", "middle");
		// we have to find a formula to determine the paramter 4 in function of font and font size
		text1.setAttribute("y", scale * (Ori.y) - (maxy - sens * eloignement - 0.5 * textheight));
		text1.setAttribute("fill", objet.Format.Dimensions_color);
		text1.setAttribute("background-color", "#ffff00");
		text1.setAttribute("font-size", objet.Format.font_size);
		text1.textContent = stringtoprint;
		theSvgElement.getElementById("dimension").appendChild(text1);

	} // else if


	return 0;
}