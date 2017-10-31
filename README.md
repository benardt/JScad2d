# JScad2d


Javascript Library for CAD 2D drawing from json file. A JSON file includes all data needed to draw paramateric 2D shape as vector image. Export in JSON file or in SVG file.

<img alt="Global view" src="https://github.com/benardt/JScad2d/blob/master/misc/VueGlobale.png">


## Description


Draw parts and assemble them in an assembly drawing. Parts and Assy drawing are build from json file. A special editor allows live drawing.

## Features

* Full parametric modeling
* Draw any shape (print squeleton for debug)
* Make fillet
* Fill shape with hatch
* Draw dimensions
* Apply transformation
  * Rotate
* Import from local drive or server
* Export on local drive with format:
  * JSON (native format)
  * SVG

## Usage

### JSON file description for PART

* Header {}
  * Type: part
  * Name
  * Title
  * Unit
* Parameters{}
* Views[]
  * [] {}
    * Header {}
      * Name
      * Origine {}
        * x
	* y
      * Hatch {}
    * Lines []
      * [] {}
	* Stroke
	* Start {}
	* End {}
    * Shapes []
      * [] {}
        * Fill
	* Points []
	  * [] {}
	    * x
	    * y
	    * length
	    * angle
	    * r
* Format{}
* Dimensions[]

### JSON file description for ASSY

* Header {}
 * Type: assy
 * Name
 * Title
 * Page size
 * Unit
* Parameters[]
* Parts[]
  * Name
  * View
  * Origine{}
  * Transformation{}
* Dimensions[]
  
### Dependencies

* jsoneditor (https://github.com/josdejong/jsoneditor/)
* svg-pan-zoom (https://github.com/ariutta/svg-pan-zoom)


