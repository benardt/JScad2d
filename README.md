# JScad2d


Javascript Library for CAD 2D drawing from json file

<img alt="Global view" src="https://github.com/benardt/JScad2d/blob/master/misc/VueGlobale.png">


## Description


Draw parts and assemble them in an assembly drawing. Parts and Assy drawing are build from json file. A special editor allows live drawing.

## Features


* Draw any shape
* Make fillet
* Fill shape with hatch
* Apply transformation
  * Rotate

## Usage

### JSON file description for PART

* Header {}
  * Type: part
  * Unit
* Parameters[]
* Views[]
  * Origine{} 
  * Shapes[]
    * Header {}
    * Points[]
  * Lines[]
  * Points[]
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
* filereader.js (https://github.com/bgrins/filereader.js)
* 

