# JScad2d


Javascript Library for CAD 2D drawing from json file


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
  * Origine {}
  * Unit
* Parameters[]
* Views[]
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
  

