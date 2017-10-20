/**
 * Some functions
 * - zoom & pan
 * - initialize
 * - debug
 *
/*




function initialize() {
    "use strict";
    //Add event listeners:
    window.addEventListener('keydown', processKeyPress, true);		// OK to let the keydown event bubble.
    window.addEventListener('mousewheel', zoomViaMouseWheel, false);	// This is required in case the user rotates the mouse wheel outside of the object element's "window".
             
    theSvgElement = document.getElementById("testEle");
    theSvgElement = document.getElementsByTagName("svg")[0];

    theSvgElement.addEventListener('keydown', processKeyPress, true);			// This is required in case the user presses an arrow key inside of the object element's "window".
    theSvgElement.addEventListener('mousewheel', zoomViaMouseWheel, false);	// This is required in case the user rotates the mouse wheel inside of the object element's "window".
      
    // If desired, one can set the initial size and position of the embedded SVG graphic here:
    theSvgElement.setAttribute('viewBox', 0 + " " + 0 + " " + 600 + " " + 400);	// The original width and height of this particular SVG graphic is 3816 and 612, respectively.
}


//  Constants:
var leftArrow   = 37;	// The numeric code for the left arrow key.
var upArrow     = 38;
var rightArrow	= 39;
var downArrow   = 40;
          
function processKeyPress(evt) {
    "use strict";
    var viewBox = theSvgElement.getAttribute('viewBox'),	// Grab the object representing the SVG element's viewBox attribute.
        viewBoxValues = viewBox.split(' ');				// Create an array and insert each individual view box attribute value (assume they're seperated by a single whitespace character).

    viewBoxValues[0] = parseFloat(viewBoxValues[0]);		// Convert string "numeric" values to actual numeric values.
    viewBoxValues[1] = parseFloat(viewBoxValues[1]);
      
    switch (evt.keyCode) {
    case leftArrow:
        viewBoxValues[0] += panRate;	// Increase the x-coordinate value of the viewBox attribute to pan right.
        break;
    case rightArrow:
        viewBoxValues[0] -= panRate;	// Decrease the x-coordinate value of the viewBox attribute to pan left.
        break;
    case upArrow:
        viewBoxValues[1] += panRate;	// Increase the y-coordinate value of the viewBox attribute to pan down.
        break;
    case downArrow:
        viewBoxValues[1] -= panRate;	// Decrease the y-coordinate value of the viewBox attribute to pan up.      
        break;
    } // switch
      
    theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));	// Convert the viewBoxValues array into a string with a white space character between the given values.
}


function zoomViaMouseWheel(mouseWheelEvent) {
    "use strict";
    if (mouseWheelEvent.wheelDelta > 0) {
        zoom('zoomIn');
    } else {
        zoom('zoomOut');
    }
        
      // When the mouse is over the webpage, don't let the mouse wheel scroll the entire webpage:
    mouseWheelEvent.cancelBubble = true;
    return false;
}

*/
