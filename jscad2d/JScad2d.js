/**
 * Function for 2D cad drawing
 * 
 * Author: Thierry Bénard
 * Date: 07 Nov 2017
 * 
 */

/*globals JSONEditor svgPanZoom*/
"use strict";

(function(window, document) {

	// -------------------------------------------
	// main variables
	// -------------------------------------------
	var myDoc;
	var theObj;
	var theSvgElement;
	var panZoomInstance;
	var editor;

	// Parameters 
	var NSSVG = 'http://www.w3.org/2000/svg';
	var WINDOWS_WIDTH = 600;

	var JScad2d = window.JScad2d = {
		doInitialization: doInitialization,
		saveTextAsFile: saveTextAsFile,
		saveTextAsSVG: saveTextAsSVG,
		displayClassToggle: displayClassToggle,
		drawOrigin: drawOrigin,
		zoomandpan: zoomandpan,
		doDebug: doDebug,
		readfile: readfile,
		loadFileAsText: loadFileAsText
	};

	/**
	 * 
	 * @param {string} expression to convert
	 * @return {number} result of equation or
	 *                  'Invalid arithmetic expression' if error
	 */
	function mathEval(exp) {
		var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
			valid = true,
			myVar,
			result;

		// Detect valid JS identifier names and replace them
		myVar = exp.replace(reg, function($0) {
			var mathf;
			// If the name is a direct member of Math, allow
			if (Math.hasOwnProperty($0)) {
				mathf = "Math." + $0;
			} else {
				// Otherwise the expression is invalid
				valid = false;
			}
			return mathf;
		});

		// Don't eval if our replace function flagged as invalid
		if (!valid) {
			result = "Invalid arithmetic expression";
		} else {
			try {
				result = eval(myVar);
			} catch (e) {
				result = "Invalid arithmetic expression";
			}
		}
		return result;
	}


	/**
	 * Load a JSON document from local disk
	 * 
	 */
	function loadFileAsText() {

		if (typeof editor !== "undefined") {
			alert("Already exist!");
			return 0;
		}

		var fileToLoad = document.getElementById("fileToLoad").files[0];
		var fileReader = new FileReader();
		fileReader.onload = function(fileLoadedEvent) {
			var textFromFileLoaded = fileLoadedEvent.target.result;
			var container = document.getElementById("jsoneditor");
			//alert(textFromFileLoaded);
			if (IsJsonString(textFromFileLoaded)) {
				editor = new JSONEditor(container);
				editor.setText(textFromFileLoaded);
				JScad2d.doInitialization();
			} else {
				alert("Error object file!");
			}
			// end here!!!
		};
		fileReader.readAsText(fileToLoad, "UTF-8");
	}


	/**
	 * Load a JSON document from server
	 * 
	 * @param {string} url
	 * @param {string} container
	 */
	function readfile(myurl) {

		if (typeof editor !== "undefined") {
			alert("Already exist!");
			return 0;
		}
		var request = new XMLHttpRequest();
		var strTemp;
		request.open('GET', myurl, false); // `false` makes the request synchronous
		request.send(null);
		if (request.status === 200) {
			// create the editor
			// needed to use JSON Editor
			var container = document.getElementById("jsoneditor");

			strTemp = request.responseText;
			if (IsJsonString(strTemp)) {
				editor = new JSONEditor(container);
				editor.setText(strTemp);
				JScad2d.doInitialization();
			} else {
				alert("Error object file!");
			}
		}
		return 0;
	}


	/**
	 * Initialize drawing
	 * 
	 * <p>
	 * Launch doInitialization at the end of load JSON function. 
	 * 1. add event
	 * 2. open window for drawing
	 * 3. build first svg element
	 * 4. launch doUpdate()
	 * </p>
	 * 
	 */
	function doInitialization() {
		var svg = "";

		if (typeof theSvgElement === "undefined") {
			// Add event to body: each time a key is hit -> launch function 'doUpdate'
			document.body.addEventListener("keyup", doUpdate, false);

			// Open new window for drawing
			var myWindow = window.open('', 'Drawing', "width=" + WINDOWS_WIDTH + ", height=450", '');
			myWindow.document.open();
			myWindow.document.writeln('<h2>Drawing</h2>');
			myWindow.document.writeln('<div id=\"drawing1\" style=\"width: 600px; height: 400px; border:1px solid black; \"></div>');
			myDoc = myWindow.document;
			myWindow.document.close();


			svg = "<svg style=\"display: inline; width: inherit; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;\" xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">";

			// Add basic information about SVG drawing
			svg += "<title>" + "My drawing" + "</title>";
			svg += "<desc>Write drawing description here...</desc>";

			svg += `<defs><style type="text/css">
				path.basicshape {
					stroke-width: 2;
					stroke: black;
				}
				line.dim {
					stroke-width: 1;
				}
				path.squeleton {
					stroke: red;
					stroke-width: 1;
					fill: white;
					fill-opacity: 0.25;
				}
				text.squeleton {
					fill: red;
				}
				circle.centerfillet {
					fill: pink;
					stroke-width: 0;
				}
				circle.origin {
					fill: blue;
					stroke-width: 0;
				}
				circle.circleptsfilletg {
					fill: green;
					stroke-width: 0;
				}
				circle.circleptsfillety {
					fill: yellow;
					stroke-width: 0;
				}
				</style></defs>
				`;

			// Add containers: dimension, origin and lines
			svg += "\n<defs id=\"hatchpattern\" ></defs>";
			svg += "\n<g id=\"dimension\"></g>";
			svg += "\n<g id=\"origin\"></g>";
			svg += "\n</svg>";

			// Draw SVG in MyDoc window
			myDoc.getElementById("drawing1").innerHTML = svg;
			// catch SVG in theSvgElement variable for further function
			theSvgElement = myDoc.getElementsByTagName("svg")[0];

			// Pattern for Arrow (marker) with default color value
			doArrowpattern();

		}

		// Start function 'doUpdate' for the first time
		doUpdate();
	}


	/**
	 * Main functuion
	 * 
	 * <p>
	 * Each time a key is stoke, the function is launched.
	 * The function draw the part with changes
	 * </p>
	 */
	function doUpdate() {

		//console.log(myDoc.defaultView);
		if (myDoc.defaultView === null) {
			alert("Window is closed!");
			return 0;
		}

		var noview = 0,
			noshape = 0,
			nodim = 0,
			currview = {};

		// Put all data from JSON editor to theObj
		theObj = editor.get();
		// Check if PART or ASSY object
		if (theObj.Header.Type === "part") {
			// no active now. Waiting coding for assy
		}
		// replace parameters by value and evaluate formula
		theObj = doDeparam(theObj);
		// put all coordinates in cartesian
		theObj = doCoordonate(theObj);

		doHatchpattern();

		// Create containers for each view or empty them if exist
		var gview = [];
		for (noview = 0; noview <= theObj.Views.length - 1; noview += 1) {
			var svgg = theSvgElement.getElementById('view' + noview);
			if (svgg === null) {
				gview.push(document.createElementNS(NSSVG, "g"));
				gview[gview.length - 1].setAttributeNS(null, "id", "view" + noview);
				gview[gview.length - 1].setAttributeNS(null, "class", "basicview");
				theSvgElement.appendChild(gview[gview.length - 1]);
			} else {
				while (svgg.firstChild) {
					svgg.removeChild(svgg.firstChild);
				}
			}
		}

		// draw shape (with fillet at corner if specified)
		for (noview = 0; noview <= theObj.Views.length - 1; noview += 1) {
			currview = theObj.Views[noview];
			for (noshape = 0; noshape <= currview.Shapes.length - 1; noshape += 1) {
				Shape(noshape, currview.Shapes[noshape].Points,
					theObj.Header.Scale,
					currview.Header.Origine,
					currview.Shapes[noshape].Fill,
					noview,
					theObj.Format,
					theSvgElement);
			}
		}


		// draw Lines from theSvgElement and view #
		for (noview = 0; noview <= theObj.Views.length - 1; noview += 1) {
			drawLine(noview, theSvgElement, theObj);
		}

		// draw dimension from the SvgElement (after remove old ones)
		svgg = theSvgElement.getElementById('dimension');
		while (svgg.firstChild) {
			svgg.removeChild(svgg.firstChild);
		}
		for (nodim = 0; nodim <= theObj.Dimensions.length - 1; nodim += 1) {
			drawDimension(theSvgElement, theObj, theObj.Dimensions[nodim]);
		} // for

		// Change Format (mainly linked with CSS)
		changeClasscolor('dim', theObj.Format.Dimensions_color, theObj.Format.shape_thick);

		// draw origin point for each view
		drawOrigin();
		displayClassToggle('ptsfillet');
		displayClassToggle('squeleton');

		displayNodesinfo();

		panZoomInstance = svgPanZoom(theSvgElement, {
			zoomEnabled: true,
			controlIconsEnabled: false
		});

		return 0;
	}



	/**
	 * Display info of Nodes
	 * 
	 * <p>
	 * - display coordinate
	 * </p>
	 */
	function displayNodesinfo() {

		var ptx = 0,
			pty = 0,
			arrpt = [],
			t;
		var svgg = theSvgElement.getElementsByClassName('textsqueleton');
		for (var i = 0; i <= svgg.length - 1; i += 1) {
			svgg[i].addEventListener('mouseover', function(evt) {
				t = evt.target;
				arrpt = t.id.split(" ");

				//1: Views; 3: Shapes; 5: Points
				ptx = theObj.Views[arrpt[1]].Shapes[arrpt[3]].Points[arrpt[5]].x;
				pty = theObj.Views[arrpt[1]].Shapes[arrpt[3]].Points[arrpt[5]].y;

				var elemx = document.getElementById("nodeinfox");
				var elemy = document.getElementById("nodeinfoy");

				elemx.setAttribute("type", "text");
				elemy.setAttribute("type", "text");

				elemx.readOnly = true;
				elemy.readOnly = true;

				elemx.size = 10;
				elemy.size = 10;

				elemx.value = ptx;
				elemy.value = pty;

				document.getElementById("outputsqueleton").innerHTML = "View: " + arrpt[1] + " / Shape: " + arrpt[3];
			});
			svgg[i].addEventListener('mouseout', function() {
				document.getElementById("nodeinfox").value = "";
				document.getElementById("nodeinfoy").value = "";
				document.getElementById("outputsqueleton").innerHTML = "";

			});
		}

		return 0;
	}



	/**
	 * do pattern for Arrows
	 */
	function doArrowpattern() {

		var myDefs = document.createElementNS(NSSVG, "defs");
		myDefs.setAttributeNS(null, "id", "markerArrow");
		var myMarker1 = document.createElementNS(NSSVG, "marker");
		var myMarker2 = document.createElementNS(NSSVG, "marker");

		myMarker1.setAttributeNS(null, "id", "markerArrowEnd");
		myMarker1.setAttributeNS(null, "class", "dim");
		myMarker1.setAttributeNS(null, "markerWidth", 13);
		myMarker1.setAttributeNS(null, "markerHeight", 13);
		myMarker1.setAttributeNS(null, "refX", 10);
		myMarker1.setAttributeNS(null, "refY", 5);
		myMarker1.setAttributeNS(null, "orient", "auto");

		myMarker2.setAttributeNS(null, "id", "markerArrowStart");
		myMarker2.setAttributeNS(null, "class", "dim");
		myMarker2.setAttributeNS(null, "markerWidth", 13);
		myMarker2.setAttributeNS(null, "markerHeight", 13);
		myMarker2.setAttributeNS(null, "refX", 2);
		myMarker2.setAttributeNS(null, "refY", 5);
		myMarker2.setAttributeNS(null, "orient", "auto");

		var myPath1 = document.createElementNS(NSSVG, "path");
		myPath1.setAttributeNS(null, "d", "M2,2 L2,9 L10,5 L2,2");
		var myPath2 = document.createElementNS(NSSVG, "path");
		myPath2.setAttributeNS(null, "d", "M2,5 L10,9 L10,2 L2,5");

		myMarker1.appendChild(myPath1);
		myMarker2.appendChild(myPath2);

		theSvgElement.appendChild(myDefs);
		myDefs.appendChild(myMarker1);
		myDefs.appendChild(myMarker2);

		return 0;
	}



	/**
	 * do Hatch patern
	 */
	function doHatchpattern() {
		var noview;

		var myDefs = theSvgElement.getElementById('hatchpattern');

		// 1st remove old hatchpattern
		while (myDefs.firstChild) {
			myDefs.removeChild(myDefs.firstChild);
		}

		// 2nd build new hatchpattern
		var myPattern = [];
		var myPath = [];
		for (noview = 0; noview <= theObj.Views.length - 1; noview += 1) {
			if (theObj.Views[noview].Header.Hatch.Distance !== null) {
				myPattern.push(document.createElementNS(NSSVG, "pattern"));
				myPattern[myPattern.length - 1].setAttributeNS(null, "id", "diagonalHatchView" + noview);
				myPattern[myPattern.length - 1].setAttributeNS(null, "patternUnits", "userSpaceOnUse");
				myPattern[myPattern.length - 1].setAttributeNS(null, "width", theObj.Views[noview].Header.Hatch.Distance);
				myPattern[myPattern.length - 1].setAttributeNS(null, "height", theObj.Views[noview].Header.Hatch.Distance);
				myPattern[myPattern.length - 1].setAttributeNS(null, "patternTransform", "rotate(" + theObj.Views[noview].Header.Hatch.Angle + " 2 2)");

				myPath.push(document.createElementNS(NSSVG, "path"));
				myPath[myPath.length - 1].setAttributeNS(null, "d", "M -1,2 l 18,0");
				myPath[myPath.length - 1].setAttributeNS(null, "stroke", theObj.Views[noview].Header.Hatch.Color);
				myPath[myPath.length - 1].setAttributeNS(null, "stroke-width", theObj.Format.Hatch_thick);

				myPattern[myPattern.length - 1].appendChild(myPath[myPath.length - 1]);
				myDefs.appendChild(myPattern[myPattern.length - 1]);

			} // if
		} // for

		return 0;
	}


	/**
	 * de de-parametrization
	 * 
	 * <p>transform all parameters in number and
	 * calculate equation with number<p>
	 * 
	 * @param {objet} main objet (json file) with all data
	 * @return {objet} object with change
	 */
	function doDeparam(objet) {

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

				myLine = document.createElementNS(NSSVG, "line");

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
	 * get angle between 3 points
	 * 
	 * @param {object} point
	 * @param {object} center point
	 * @param {object} point
	 * @retunr {number} angle
	 */
	function getAngleABC(a, b, c) {
		var ab = {
			x: b.x - a.x,
			y: b.y - a.y
		};
		var cb = {
			x: b.x - c.x,
			y: b.y - c.y
		};

		// dot product  
		var dot = ab.x * cb.x + ab.y * cb.y;

		// length square of both vectors
		var abSqr = ab.x * ab.x + ab.y * ab.y;
		var cbSqr = cb.x * cb.x + cb.y * cb.y;

		// square of cosine of the needed angle    
		var cosSqr = dot * dot / abSqr / cbSqr;

		// this is a known trigonometric equality:
		// cos(alpha * 2) = [ cos(alpha) ]^2 * 2 - 1
		var cos2 = 2 * cosSqr - 1;

		// Here's the only invocation of the heavy function.
		// It's a good idea to check explicitly if cos2 is within [-1 .. 1] range

		var alpha2 = 0;
		if (cos2 <= -1) {
			alpha2 = Math.PI;
		} else if (cos2 >= 1) {
			alpha2 = 0;
		} else {
			alpha2 = Math.acos(cos2);
		}

		var rslt = alpha2 / 2;

		// Now revolve the ambiguities.
		// 1. If dot product of two vectors is negative - the angle is definitely
		// above 90 degrees. Still we have no information regarding the sign of the angle.

		// NOTE: This ambiguity is the consequence of our method: calculating the cosine
		// of the double angle. This allows us to get rid of calling sqrt.

		if (dot < 0) {
			rslt = Math.PI - rslt;
		}

		return rslt;
	}



	/**
	 * draw one shape
	 * 
	 * <p>
	 * - return a path inside a <g></g> tag
	 * - draw texture according to texture variable (hatch or not)
	 * </p>
	 * 
	 * @param {} ...
	 */
	function Shape() {
		"use strict";
		var i,
			mydattr = "",
			noshape = arguments[0],
			pts = arguments[1], // points du squelette de la forme pleine
			scale = arguments[2], // échelle de l'affichage
			ori = arguments[3], // origine du dessin
			texture = arguments[4], // texture
			noview = arguments[5], // view # for hatch pattern
			format = arguments[6], // format
			thesvgelem = {},

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

		thesvgelem = arguments[7];

		var myView = "view" + noview;
		var mySvg = thesvgelem.getElementById(myView);

		var gobj = [],
			gname = ['basicshape', 'squeleton', 'squeletontext', 'centerfillet', 'ptsfillet'];

		for (i = 0; i <= gname.length - 1; i += 1) {
			gobj.push(document.createElementNS(NSSVG, 'g'));
			gobj[gobj.length - 1].setAttributeNS(null, 'class', gname[gobj.length - 1]);
			mySvg.appendChild(gobj[gobj.length - 1]);
		}

		// find number for previous and next point
		// p is number of previous point
		// s is number of next point
		for (i = 0; i <= pts.length - 1; i += 1) {
			p[i] = (i - 1 + pts.length) % pts.length;
			s[i] = (i + 1) % pts.length;
		}

		// Find angle at each point
		for (i = 0; i <= pts.length - 1; i += 1) {
			angle[i] = getAngleABC(pts[p[i]], pts[i], pts[s[i]]);
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
		// coordinates of the point R are ((mx2 + nx1)/(m + n), (my2 + ny1)/(m + n))
		// the point R divides the line-segment internally in a given ratio m : n

		// For fillet (circle) ratio is find from kappa parameter
		// source: http://www.whizkidtech.redprince.net/bezier/circle/

		for (i = 0; i <= pts.length - 1; i += 1) {
			if (pts[i].r !== null) {
				// for previous
				ax = pts[p[i]].x - pts[i].x;
				ay = pts[p[i]].y - pts[i].y;

				n = l[i];
				m = Math.sqrt(ax * ax + ay * ay) - n;

				pr[2 * i] = {
					x: (m * pts[i].x + n * pts[p[i]].x) / (m + n),
					y: (m * pts[i].y + n * pts[p[i]].y) / (m + n)
				};

				n = l[i] * (1 - KAPPA);
				m = Math.sqrt(ax * ax + ay * ay) - n;
				pr[2 * i + 1] = {
					x: (m * pts[i].x + n * pts[p[i]].x) / (m + n),
					y: (m * pts[i].y + n * pts[p[i]].y) / (m + n)
				};


				// for next
				bx = pts[s[i]].x - pts[i].x;
				by = pts[s[i]].y - pts[i].y;

				n = l[i];
				m = Math.sqrt(bx * bx + by * by) - n;
				su[2 * i] = {
					x: (m * pts[i].x + n * pts[s[i]].x) / (m + n),
					y: (m * pts[i].y + n * pts[s[i]].y) / (m + n)
				};

				n = l[i] * (1 - KAPPA);
				m = Math.sqrt(bx * bx + by * by) - n;
				su[2 * i + 1] = {
					x: (m * pts[i].x + n * pts[s[i]].x) / (m + n),
					y: (m * pts[i].y + n * pts[s[i]].y) / (m + n)
				};

			}
		}

		// path
		// Moveto: M x,y where x and y are absolute coordinates, horizontal and vertical respectively
		// Lineto: "Lx,y" where x and y are absolute coordinates
		// Curveto: Cubic Bezier curve "C c1x,c1y c2x,c2y x,y" where c1x,c1y, and c2x,c2y are the
		//     absolute coordinates of the control points for the initial point and end point, respectively.
		//     x and y are the absolute coordinates of the end point.

		// Main shape

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

		// texture de la forme
		if (texture === "hatch") {
			var myFill = 'url(#diagonalHatch' + 'View' + noview + ')';
		} else {
			myFill = 'white';
		}

		var path = document.createElementNS(NSSVG, 'path');
		path.setAttributeNS(null, 'class', 'basicshape');
		path.setAttributeNS(null, 'd', mydattr);
		path.setAttributeNS(null, 'fill', myFill);
		gobj[0].appendChild(path);

		// print squeleton

		// courbe d'origine sans les fillet pour le debug
		mydattr = "M";
		for (i = 0; i <= pts.length - 1; i += 1) {
			mydattr += " " + (scale * (ori.x + pts[i].x)) + " " + (scale * (ori.y - pts[i].y)) + " L";
		}
		mydattr = mydattr.substring(0, mydattr.length - 2);
		mydattr += "z";

		var path1 = document.createElementNS(NSSVG, 'path');
		path1.setAttributeNS(null, 'class', 'squeleton');
		path1.setAttributeNS(null, 'd', mydattr);
		gobj[1].appendChild(path1);

		// Print key points of shape (squeleton) class = textsqueleton
		var texte = [];
		var len = 0;
		// Affiche les numéros de chaque point
		for (i = 0; i <= pts.length - 1; i += 1) {
			texte.push(document.createElementNS(NSSVG, 'text'));
			len = texte.length - 1;
			texte[len].setAttributeNS(null, 'class', 'squeleton textsqueleton');
			texte[len].setAttributeNS(null, 'id', 'view: ' + noview + ' shape: ' + noshape + ' node: ' + i);
			texte[len].setAttributeNS(null, 'x', scale * (ori.x + pts[i].x));
			texte[len].setAttributeNS(null, 'y', scale * (ori.y - pts[i].y));
			texte[len].setAttributeNS(null, 'font-size', format.font_size);
			texte[len].innerHTML = i;
			gobj[2].appendChild(texte[len]);
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

				gobj[3].appendChild(createCircle(
					scale * (ori.x + ca),
					scale * (ori.y - cb),
					3, 'squeleton centerfillet'));
			}
		} // end for


		// Print key points of fillet (squeleton) class=ptsfillet
		// class allow to print or not with .style.visibility property
		len = 0;

		for (i = 0; i <= pts.length - 1; i += 1) {
			if (pts[i].r !== null) {
				gobj[4].appendChild(createCircle(
					scale * (ori.x + pr[2 * i].x),
					scale * (ori.y - pr[2 * i].y),
					3, 'circleptsfillety'));

				gobj[4].appendChild(createCircle(
					scale * (ori.x + pr[2 * i + 1].x),
					scale * (ori.y - pr[2 * i + 1].y),
					3, 'circleptsfilletg'));

				gobj[4].appendChild(createCircle(
					scale * (ori.x + su[2 * i].x),
					scale * (ori.y - su[2 * i].y),
					3, 'circleptsfillety'));

				gobj[4].appendChild(createCircle(
					scale * (ori.x + su[2 * i + 1].x),
					scale * (ori.y - su[2 * i + 1].y),
					3, 'circleptsfilletg'));
			}
		}

		return 0;
	}

	/**
	 * Create circle element for SVG
	 * 
	 * @param {number} x position for center
	 * @param {number} y position for center
	 * @param {number} radius
	 * @param {string} class
	 * @return {SVG element} SVG circle element
	 */
	function createCircle(mycx, mycy, myRadius, myClass) {
		var cercleelem = document.createElementNS(NSSVG, 'circle');
		cercleelem.setAttributeNS(null, 'cx', mycx);
		cercleelem.setAttributeNS(null, 'cy', mycy);
		cercleelem.setAttributeNS(null, 'r', myRadius);
		cercleelem.setAttributeNS(null, 'class', myClass);
		return cercleelem;
	}

	/**
	 * draw dimensions
	 * 
	 * @param {element} SVG
	 * @param {object} raw data in object notation
	 * @param {object} dimension[i] from object
	 */
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

		// Create g element for current dimension
		var svgg = document.createElementNS(NSSVG, "g");
		theSvgElement.getElementById("dimension").appendChild(svgg);

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
			line1 = document.createElementNS(NSSVG, "line");
			line1.setAttribute("class", "dim");
			line1.setAttribute("x1", scale * (Ori.x + PtStart.x) + sens * eloignement);
			line1.setAttribute("y1", scale * (Ori.y - PtStart.y));
			line1.setAttribute("x2", scale * (Ori.x) + maxx);
			line1.setAttribute("y2", scale * (Ori.y - PtStart.y));
			svgg.appendChild(line1);

			// lignes d'attache (End side)
			line2 = document.createElementNS(NSSVG, "line");
			line2.setAttribute("class", "dim");
			line2.setAttribute("x1", scale * (Ori.x + PtEnd.x) + sens * eloignement);
			line2.setAttribute("y1", scale * (Ori.y - PtEnd.y));
			line2.setAttribute("x2", scale * (Ori.x) + maxx);
			line2.setAttribute("y2", scale * (Ori.y - PtEnd.y));
			svgg.appendChild(line2);

			// Global line start
			line3 = document.createElementNS(NSSVG, "line");
			line3.setAttribute("class", "dim");
			line3.setAttribute("x1", scale * (Ori.x) + (maxx - sens * eloignement));
			line3.setAttribute("y1", scale * (Ori.y - PtStart.y));
			line3.setAttribute("x2", scale * (Ori.x) + (maxx - sens * eloignement));
			line3.setAttribute("y2", scale * (Ori.y - PtStart.y - 0.5 * (PtEnd.y - PtStart.y)) - Number(textheight));
			line3.setAttribute('marker-start', 'url(#markerArrowStart)');
			//line3.setAttribute('marker-end', 'url(#markerArrowEnd)');
			svgg.appendChild(line3);

			// Global line end
			line4 = document.createElementNS(NSSVG, "line");
			line4.setAttribute("class", "dim");
			line4.setAttribute("x1", scale * (Ori.x) + (maxx - sens * eloignement));
			line4.setAttribute("y1", scale * (Ori.y - PtStart.y - 0.5 * (PtEnd.y - PtStart.y)) + Number(textheight));
			line4.setAttribute("x2", scale * (Ori.x) + (maxx - sens * eloignement));
			line4.setAttribute("y2", scale * (Ori.y - PtEnd.y));
			//line4.setAttribute('marker-start', 'url(#markerArrowStart)');
			line4.setAttribute('marker-end', 'url(#markerArrowEnd)');
			svgg.appendChild(line4);

			// text
			text1 = document.createElementNS(NSSVG, "text");
			text1.setAttribute("class", "dim");
			// need some special formula to take into account the height of font
			text1.setAttribute("x", scale * Ori.x + (maxx - sens * eloignement) - 0.5 * objet.Format.font_size * (0.35146 / 25.4) * 96);
			text1.setAttribute("text-anchor", "middle");
			text1.setAttribute("style", "writing-mode: tb;");
			text1.setAttribute("y", scale * (Ori.y - (PtStart.y + PtEnd.y) / 2));
			text1.setAttribute("font-size", objet.Format.font_size);
			text1.textContent = stringtoprint;
			svgg.appendChild(text1);

		} else if (dim.Direction === "horizontal") {

			// text
			stringtoprint = prefix + Math.abs(PtEnd.x - PtStart.x);

			maxy = Math.max(scale * PtStart.y + sens * longueur, scale * PtEnd.y + sens * longueur);

			// lignes d'attache (Start side)
			line1 = document.createElementNS(NSSVG, "line");
			line1.setAttribute("class", "dim");
			line1.setAttribute("x1", scale * (Ori.x + PtStart.x));
			line1.setAttribute("y1", scale * (Ori.y - PtStart.y) - sens * eloignement);
			line1.setAttribute("x2", scale * (Ori.x + PtStart.x));
			line1.setAttribute("y2", scale * (Ori.y) - maxy);
			svgg.appendChild(line1);

			// lignes d'attache (End side)
			line2 = document.createElementNS(NSSVG, "line");
			line2.setAttribute("class", "dim");
			line2.setAttribute("x1", scale * (Ori.x + PtEnd.x));
			line2.setAttribute("y1", scale * (Ori.y - PtEnd.y) - sens * eloignement);
			line2.setAttribute("x2", scale * (Ori.x + PtEnd.x));
			line2.setAttribute("y2", scale * (Ori.y) - maxy);
			svgg.appendChild(line2);

			// Global line start
			line3 = document.createElementNS(NSSVG, "line");
			line3.setAttribute("class", "dim");
			line3.setAttribute("x1", scale * (Ori.x + PtStart.x));
			line3.setAttribute("y1", scale * (Ori.y) - (maxy - sens * eloignement));
			line3.setAttribute("x2", scale * (Ori.x + PtStart.x + 0.5 * (PtEnd.x - PtStart.x)) - 0.5 * getWidthString(stringtoprint, objet.Format.font_size, "Helvetica"));
			line3.setAttribute("y2", scale * (Ori.y) - (maxy - sens * eloignement));
			line3.setAttribute('marker-start', 'url(#markerArrowStart)');
			//line3.setAttribute('marker-end', 'url(#markerArrowEnd)');
			svgg.appendChild(line3);

			// Global line end
			line4 = document.createElementNS(NSSVG, "line");
			line4.setAttribute("class", "dim");
			line4.setAttribute("x1", scale * (Ori.x + PtStart.x + 0.5 * (PtEnd.x - PtStart.x)) + 0.5 * getWidthString(stringtoprint, objet.Format.font_size, "Helvetica"));
			line4.setAttribute("y1", scale * (Ori.y) - (maxy - sens * eloignement));
			line4.setAttribute("x2", scale * (Ori.x + PtEnd.x));
			line4.setAttribute("y2", scale * (Ori.y) - (maxy - sens * eloignement));
			//line4.setAttribute('marker-start', 'url(#markerArrowStart)');
			line4.setAttribute('marker-end', 'url(#markerArrowEnd)');
			svgg.appendChild(line4);

			// text
			text1 = document.createElementNS(NSSVG, "text");
			text1.setAttribute("class", "dim");
			text1.setAttribute("x", scale * (Ori.x + (PtStart.x + PtEnd.x) / 2));
			text1.setAttribute("text-anchor", "middle");
			// we have to find a formula to determine the paramter 4 in function of font and font size
			text1.setAttribute("y", scale * (Ori.y) - (maxy - sens * eloignement - 0.5 * textheight));
			text1.setAttribute("background-color", "#ffff00");
			text1.setAttribute("font-size", objet.Format.font_size);
			text1.textContent = stringtoprint;
			svgg.appendChild(text1);

		} // else if

		return 0;
	}

	/**
	 * change color for line, text and marker for className
	 * 
	 * @param {string} className (name of class)
	 * @param {string} color (name of color)
	 * @param {number} myThickness (thickness for shape)
	 */
	function changeClasscolor(className, color, myThickness) {
		// change color for className ('dim')
		var cols = theSvgElement.getElementsByClassName(className);
		for (var i = 0; i < cols.length; i++) {
			if (cols[i].tagName === "line") {
				cols[i].style.stroke = color;
			} else if (cols[i].tagName === "text") {
				cols[i].style.fill = color;
			} else if (cols[i].tagName === "marker") {
				cols[i].style.fill = color;
			}
		}
		// change thickness for shape class=basicshape
		cols = theSvgElement.getElementsByClassName('basicshape');
		for (i = 0; i < cols.length; i++) {
			if (cols[i].tagName === "path") {
				cols[i].style.strokeWidth = myThickness;
			}
		}
	}


	/**
	 * draw point constructor for fillet
	 * 
	 * <p>
	 * Take myVar from checkbox with id
	 * modify all element with class myvar
	 * </p>
	 * 
	 * @param {string} myVar
	 */
	function displayClassToggle(myVar) {
		//var x = document.forms.myForm2;
		var x = document.getElementById(myVar);
		if (x[0].checked === true) {
			var nodes = theSvgElement.getElementsByClassName(myVar);
			for (var i = 0, len = nodes.length; i < len; i++) {
				nodes[i].style.visibility = "visible";
			}
		} else if (x[0].checked === false) {
			nodes = theSvgElement.getElementsByClassName(myVar);
			for (i = 0, len = nodes.length; i < len; i++) {
				nodes[i].style.visibility = "hidden";
			}
		}
		return 0;
	}


	/**
	 * Draw origin point in color
	 * 
	 */
	function drawOrigin() {
		var x = document.forms.myForm1,
			noview,
			currview = theObj.Views;

		if (x[0].checked === true) {
			// draw origin for each View
			for (noview = 0; noview <= currview.length - 1; noview += 1) {
				var circle = document.createElementNS(NSSVG, "circle");
				circle.setAttribute("class", 'origin');
				circle.setAttribute("cx", theObj.Header.Scale * currview[noview].Header.Origine.x);
				circle.setAttribute("cy", theObj.Header.Scale * currview[noview].Header.Origine.y);
				circle.setAttribute("r", 4);
				theSvgElement.getElementById("origin").appendChild(circle);
			} // for
		} else if (x[0].checked === false) {
			var element = theSvgElement.getElementById("origin");
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			} // while
		} // if

		return 0;
	} // drawOrigin

	/**
	 * Save data as .SVG file
	 * 
	 */
	function saveTextAsSVG() {
		"use strict";
		//var textToWrite = document.getElementById("inputTextToSave").value;
		var json = editor.get();
		var textToWrite = myDoc.getElementById("drawing1").innerHTML;

		var textFileAsBlob = new Blob([textToWrite], {
			type: 'text/plain'
		});
		var fileNameToSaveAs = json.Header.Name + "_svg.svg";

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		if (typeof window.webkitURL !== "undefined") {
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		} else {
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.

			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);

		}
		simulateClick(downloadLink);
	}

	/**
	 * destro Click element
	 */
	function destroyClickedElement(myEvent) {
		document.body.removeChild(myEvent.target);
	}

	/**
	 * Save data in JSON file
	 * 
	 * <p>plain text in JSON format</p>
	 */
	function saveTextAsFile() {
		"use strict";

		var json = editor.get();
		var textToWrite = JSON.stringify(json, null, 2);

		var textFileAsBlob = new Blob([textToWrite], {
			type: 'text/plain'
		});
		var fileNameToSaveAs = json.Header.Name + ".json";

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		if (typeof window.webkitURL !== "undefined") {
			// Chrome allows the link to be clicked
			// without actually adding it to the DOM.
			downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		} else {
			// Firefox requires the link to be added to the DOM
			// before it can be clicked.
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedElement;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);
		}

		simulateClick(downloadLink);

	}

	function simulateClick(cb) {
		var event = new MouseEvent('click', {
			view: window,
			bubbles: true,
			cancelable: true
		});

		var cancelled = !cb.dispatchEvent(event);
		if (cancelled) {
			// A handler called preventDefault.
			alert("cancelled");
		} else {
			// None of the handlers called preventDefault.
			//alert("not cancelled");
		}
	}

	/**
	 * zoom & pan function
	 * 
	 * @param {string} zoomIn, zoomOut or left, right, up , down
	 */
	function zoomandpan(zoomType) {
		var myStep = 30;
		if (zoomType === 'zoomIn') {
			panZoomInstance.zoomIn();
		} else if (zoomType === 'zoomOut') {
			panZoomInstance.zoomOut();
		} else if (zoomType === 'left') {
			panZoomInstance.panBy({
				x: 0 - myStep,
				y: 0
			});
		} else if (zoomType === 'up') {
			panZoomInstance.panBy({
				x: 0,
				y: myStep
			});
		} else if (zoomType === 'down') {
			panZoomInstance.panBy({
				x: 0,
				y: 0 - myStep
			});
		} else if (zoomType === 'right') {
			panZoomInstance.panBy({
				x: myStep,
				y: 0
			});
		} else if (zoomType === 'reset') {
			panZoomInstance.resetZoom();
			panZoomInstance.resetPan();
		} else {
			alert("function zoom(zoomType) given invalid zoomType parameter.");
		}
	}
	

	/**
	 * print Debug data in another window
	 */
	function doDebug() {

		var i = 0,
			noView = 0,
			myWindow,
			myDocDebug;

		// Open new window for debug
		myWindow = window.open('', 'Debug', "width=700, height=400", '');
		myDocDebug = myWindow.document;

		myDocDebug.open();
 
		myDocDebug.writeln('<h2>Debug</h2>');
		myDocDebug.body.style.backgroundColor = "black";
		myDocDebug.body.style.color = "white";
		myDocDebug.body.style.fontFamily = "Courier";
		myDocDebug.writeln('<div id=\"debug\"></div>');

		myDocDebug.close();

		if (typeof theObj === "undefined") {
			myDocDebug.getElementById("debug").innerHTML = "Drawing not loaded";
		} else {
			myDocDebug.getElementById("debug").innerHTML += doDebugLine("The type is:", theObj.Header.Type, "OK");
			myDocDebug.getElementById("debug").innerHTML += doDebugLine("The name is:", theObj.Header.Name, "OK");
			myDocDebug.getElementById("debug").innerHTML += doDebugLine("The title is:", theObj.Header.Title, "OK");

			noView = theObj.Views.length;
			myDocDebug.getElementById("debug").innerHTML += doDebugLine("The number of view is:", noView, "OK");
			if (noView > 0) {
				for (i = 0; i <= noView - 1; i += 1) {
					myDocDebug.getElementById("debug").innerHTML += doDebugLine("The number of shape in view" + i + " is:", theObj.Views[i].Shapes.length, "OK");
				}
			}
		}

		return 0;
	}

	/**
	 * function for Debug
	 * 
	 * <p>calculate the line width</p>
	 * 
	 */
	function doDebugLine(varA, varB, varC) {
		var MAXCHAR = 60;
		var i, strTmp, nbpoint;
		strTmp = varA + " " + varB + " ";
		nbpoint = MAXCHAR - strTmp.length;
		for (i = 0; i <= nbpoint - 1; i += 1) {
			strTmp += ".";
		}
		strTmp += varC + "<br>";
		return strTmp;
	}

	/**
	 * Test if str is JSON format
	 * 
	 * @param {string} str
	 * @return {boolean} true or false
	 */
	function IsJsonString(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}


})(this, document);