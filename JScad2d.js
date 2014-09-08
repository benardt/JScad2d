/*\
        Function for 2D cad drawing
        
        
        
        Author: Thierry Bénard
        Date: 04 Sep 2014


\*/


// --------------------------------------------------
// object descriptor: Point
// --------------------------------------------------
function Point(x, y, r) {
    "use strict";
    this.x = x;
    this.y = y;
    this.r = r;
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


// -----------------------------------------------------------------
// Name: Shape
// Result: SVG form
// Som debug print are included: squeleton, center of fillet
// -----------------------------------------------------------------
function Shape() {
    "use strict";
	var i,
	    ttexte,                    // variable texte à retourner
	    pts = arguments[1],        // points du squelette de la forme pleine
	    scale = arguments[2],      // échelle de l'affichage
	    ori = arguments[3],        // origine du dessin
        texture = arguments[4],     // texture
        noview = arguments[5],      // view # for hatch pattern
        affichage = arguments[6],   // 1: affiche, 0: n'affiche pas
        format = arguments[7],      // format

        p = [],                     // number of previous point
        s = [],                     // number of next point
        
        angle = [],                 // angle value at each point
        ax,
        ay,
        bx,
        by,
    
        l = [],                     // Length between point and start & end point of fillet
    
        pr = [],
        su = [],
        m,
        n,
        kappa = 0.5522847498;
    
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

	// Calcul de la longueur (pour positionner les 2 pts "précédent" et "suivant")
	for (i = 0; i <= pts.length - 1; i += 1) {
        // do only if radius exist
		if (pts[i].r !== null) {
			l[i] = pts[i].r / Math.tan(angle[i] / 2.0);
		}
	}

	// Calcul des coordonnées des points "précédent" et "suivant".
    // Ce sont les points qui débutent et ferment le 'fillet'
    // (x2, y2) = current point, (x1, y1) = previous or next point
    
    // Division of line segment
    // co-ordinates of the point R are ((mx2 + nx1)/(m + n), (my 2 + ny1)/(m + n))
    // the point R divides the line-segment internally in a given ratio m : n
    
    // For fillet (circle) ratio is find from kappa parameter

	for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			// calcul sur précédent
			ax = pts[p[i]].x - pts[i].x;
			ay = pts[p[i]].y - pts[i].y;
			
			n = l[i];
			m = Math.sqrt(ax * ax + ay * ay) - n;
			
			pr[2 * i] = new Point((m * pts[i].x + n * pts[p[i]].x) / (m + n),
                                  (m * pts[i].y + n * pts[p[i]].y) / (m + n), null);
			
			n = l[i] - pts[i].r * kappa;
			m = Math.sqrt(ax * ax + ay * ay) - n;
			pr[2 * i + 1] = new Point((m * pts[i].x + n * pts[p[i]].x) / (m + n),
                                      (m * pts[i].y + n * pts[p[i]].y) / (m + n), null);
            
			// calcul sur suivant
			bx = pts[s[i]].x - pts[i].x;
			by = pts[s[i]].y - pts[i].y;
			
			n = l[i];
			m = Math.sqrt(bx * bx + by * by) - n;
			su[2 * i] = new Point((m * pts[i].x + n * pts[s[i]].x) / (m + n),
                                  (m * pts[i].y + n * pts[s[i]].y) / (m + n), null);
			
			n = l[i] - pts[i].r * kappa;
			m = Math.sqrt(bx * bx + by * by) - n;
			su[2 * i + 1] = new Point((m * pts[i].x + n * pts[s[i]].x) / (m + n),
                                      (m * pts[i].y + n * pts[s[i]].y) / (m + n), null);
		}
	}

	if (affichage === 1) {
		// courbe d'origine sans les fillet pour le debug
		ttexte = "<path d=\"M";
		for (i = 0; i <= pts.length - 1; i += 1) {
			ttexte += " " + (ori.x + scale * pts[i].x) + " " + (ori.y - scale * pts[i].y) + " L";
		}
		ttexte = ttexte.substring(0, ttexte.length - 2);
		ttexte += "z\" fill=\"white\" stroke=\"red\" stroke-width=\"1\" />";
	}
      
    // courbe avec les fillet
    ttexte += "<g><path d=\"M";
    for (i = 0; i <= pts.length - 1; i += 1) {
		if (pts[i].r !== null) {
			ttexte += (ori.x + scale * pr[2 * i].x) + "," +
                      (ori.y - scale * pr[2 * i].y) + " C" +
                      (ori.x + scale * pr[2 * i + 1].x) + "," +
                      (ori.y - scale * pr[2 * i + 1].y) + " " +
                      (ori.x + scale * su[2 * i + 1].x) + "," +
                      (ori.y - scale * su[2 * i + 1].y) + " " +
                      (ori.x + scale * su[2 * i].x) + "," +
                      (ori.y - scale * su[2 * i].y) + " L";
		} else {
			ttexte += (ori.x + scale * pts[i].x) + "," + (ori.y - scale * pts[i].y) + " L";
		}
    }
      
    ttexte = ttexte.substring(0, ttexte.length - 2);
	
	// texture de la forme
	if (texture === "hatch") {
		ttexte += "z\" fill=\"url(#diagonalHatch" + "View" + noview +")\" stroke=\"black\" stroke-width=\"2\" /></g>";
	} else {
		ttexte += "z\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" /></g>";
	}
	
    // Print key points of shape (squeleton)
	if (affichage === 1) {
		// Affiche les numéros de chaque point
		for (i = 0; i <= pts.length - 1; i += 1) {
			ttexte += "<text x=\"" + (ori.x + scale * pts[i].x) + "\"" +
                           " y=\"" + (ori.y - scale * pts[i].y) + "\"" +
                           " font-size=\"" + format.font_size + "\" fill=\"red\">" + i + "</text>";
		}
	}
	
	// Print key points of fillet (squeleton)
	if (affichage === 2) {
        for (i = 0; i <= pts.length - 1; i += 1) {
		    if (pts[i].r !== null) {
			    ttexte += "<circle cx=\"" + (ori.x + scale * pr[2 * i].x) + "\"" +
                                 " cy=\"" + (ori.y - scale * pr[2 * i].y) + "\"" +
                                 " r=\"6\" stroke=\"black\" stroke-width=\"0\" fill=\"yellow\"/>";
			    ttexte += "<circle cx=\"" + (ori.x + scale * pr[2 * i + 1].x) + "\"" +
                                 " cy=\"" + (ori.y - scale * pr[2 * i + 1].y) + "\"" +
                                 " r=\"6\" stroke=\"black\" stroke-width=\"0\" fill=\"green\"/>";
			    ttexte += "<circle cx=\"" + (ori.x + scale * su[2 * i].x) + "\"" +
                                 " cy=\"" + (ori.y - scale * su[2 * i].y) + "\"" +
                                 " r=\"6\" stroke=\"black\" stroke-width=\"0\" fill=\"yellow\"/>";
			    ttexte += "<circle cx=\"" + (ori.x + scale * su[2 * i + 1].x) + "\"" +
                                 " cy=\"" + (ori.y - scale * su[2 * i + 1].y) + "\"" +
                                 " r=\"6\" stroke=\"black\" stroke-width=\"0\" fill=\"green\"/>";
		    }
	    }
	}

	// Print center of fillet (in red)
	if (affichage === 1) {
        var ma, ca, mb, cb,
            x0, x1, y0, y1;
	    for (i = 0; i <= pts.length - 1; i += 1) {
		    if (pts[i].r !== null) {
			    // rotation du point de base autour du point de départ du congé de 90°
			    // 1. changement de repère
			    x1 = pts[i].x - pr[2 * i].x;
			    y1 = pts[i].y - pr[2 * i].y;
			    // 2. rotation de 90°
			    x0 = -y1;
			    y0 = x1;
			    // 3. changement de repère inverse
			    x0 = x0 + pr[2 * i].x;
			    y0 = y0 + pr[2 * i].y;

			    x1 = pr[2 * i].x;
			    y1 = pr[2 * i].y;

			    // Calcul des paramètres de la droite
			    ma = (y1 - y0) / (x1 - x0);
			    ca = (x1 * y0 - x0 * y1) / (x1 - x0);
		
			    // rotation du point de base autour du point de départ du congé de 90°
			    // 1. changement de repèe
			    x1 = pts[i].x - su[2 * i].x;
			    y1 = pts[i].y - su[2 * i].y;
			    // 2. rotation de 90°
			    x0 = -y1;
			    y0 = x1;
			    // 3. changement de repère inverse
			    x0 = x0 + su[2 * i].x;
			    y0 = y0 + su[2 * i].y;
			
			    x1 = su[2 * i].x;
			    y1 = su[2 * i].y;
			    // Calcul des paramètres de la droite
			    mb = (y1 - y0) / (x1 - x0);
			    cb = (x1 * y0 - x0 * y1) / (x1 - x0);
			
			    // prise en compte des droites verticales m = infini ou -infini
			    if (ma === "Infinity" || ma === "-Infinity") {
				    x0 = pr[2 * i].x;
				    y0 = mb * x0 + cb;
			    } else if (mb === "Infinity" || mb === "-Infinity") {
				    x0 = su[2 * i].x;
				    y0 = ma * x0 + ca;
			    } else {
				    x0 = (cb - ca) / (ma - mb);
				    y0 = ma * x0 + ca;
			    }
			
			    ttexte += "<circle cx=\"" + (ori.x + scale * x0) +
                               "\" cy=\"" + (ori.y - scale * y0) +
                               "\" r=\"4\" stroke-width=\"0\" fill=\"red\"/>";
		    }
	    }
	}
	
	return ttexte;
}



//---------------------------------------------------------------------------------------
// Calculator parser: string --> value
//---------------------------------------------------------------------------------------
function mathEval(exp) {
    "use strict";
    var reg = /(?:[a-z$_][a-z0-9$_]*)|(?:[;={}\[\]"'!&<>^\\?:])/ig,
        valid = true;

    // Detect valid JS identifier names and replace them
    exp = exp.replace(reg, function ($0) {
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
        try { return eval(exp); } catch (e) { return "Invalid arithmetic expression"; }
    }
}

//--------------------------------------------------------------------------------------------
// Draw dimension
//--------------------------------------------------------------------------------------------
function Dimension(objet, dim) {
    "use strict";
	var res,
        eloignement = 5,            // length in pixel between shape and attach line
        longueur = dim.FreeSpace,   // length in pixel between dimension line and shape

        PtStart = objet.Views[dim.PtStart.View].Shapes[dim.PtStart.Shape].Points[dim.PtStart.Point],
        PtEnd = objet.Views[dim.PtEnd.View].Shapes[dim.PtEnd.Shape].Points[dim.PtEnd.Point],
        Ori = objet.Views[dim.PtStart.View].Header.Origine,
        scale = objet.Header.Scale,
        
        maxy,
        stringtoprint;              // text to print
	
	res = "<g>";
	if (dim.Direction === "vertical") {
		
		
	} else if (dim.Direction === "horizontal") {
		maxy = Math.max(scale * PtStart.y + longueur, scale * PtEnd.y + longueur);
		// lignes d'attache (Start side)
		res += "<line ";
		res += " x1=\"" + (scale * PtStart.x + Ori.x) + "\"" +
               " y1=\"" + (Ori.y - (scale * PtStart.y + eloignement)) + "\" ";
		res += " x2=\"" + (scale * PtStart.x + Ori.x) + "\"" +
               "y2=\"" + (Ori.y - maxy) + "\" ";
		res += " style=\"stroke:" + objet.Format.Dimensions_color + ";stroke-width:1\" />";
		
		// lignes d'attache (End side)
		res += "<line ";
		res += " x1=\"" + (scale * PtEnd.x + Ori.x) + "\"" +
               " y1=\"" + (Ori.y - (scale * PtEnd.y + eloignement)) + "\" ";
		res += " x2=\"" + (scale * PtEnd.x + Ori.x) + "\"" +
               " y2=\"" + (Ori.y - maxy) + "\" ";
		res += " style=\"stroke:" + objet.Format.Dimensions_color + ";stroke-width:1\" />";
		
		// Global line
		res += "<line ";
		res += " x1=\"" + (scale * PtStart.x + Ori.x) + "\"" +
               "y1=\"" + (Ori.y -  (maxy - eloignement)) + "\" ";
		res += " x2=\"" + (scale * PtEnd.x + Ori.x) + "\"" +
               "y2=\"" + (Ori.y - (maxy - eloignement)) + "\" ";
		res += " style=\"stroke:" + objet.Format.Dimensions_color + ";stroke-width:1;" +
               " marker-start: url(#markerArrowStart); marker-end: url(#markerArrowEnd);\" />";
		
		
		// text
		stringtoprint = (PtStart.x + PtEnd.x + " " + objet.Header.Unit);
		res += "<text" +
               " x=\"" + (Ori.x + scale * 0.5 * (PtStart.x + PtEnd.x) -
                 0.5 * getWidthString(stringtoprint, objet.Format.font_size, "Helvetica")) + "\"" +
               " y=\"" + (Ori.y - maxy) +
               "\" fill=\"" + objet.Format.Dimensions_color +
               "\" font-size=\"" + objet.Format.font_size + "\" >" + stringtoprint + "</text>";

	}

	res += "<g>";
	return res;
}



	
