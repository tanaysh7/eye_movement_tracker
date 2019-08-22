(function exampleCode() {
	"use strict";

	brfv4Example.initCurrentExample = function (brfManager, resolution) {
		// XMLHttpRequest.prototype.send = function() {
        //     return false;
        //   }
		brfManager.init(resolution, resolution, brfv4Example.appId);


		
	};


	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
		  color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	  }

	brfv4Example.updateCurrentExample = function (brfManager, imageData, draw) {

		brfManager.update(imageData);

		draw.clear();

		// Face detection results: a rough rectangle used to start the face tracking.

		// draw.drawRects(brfManager.getAllDetectedFaces(), false, 1.0, 0x00a1ff, 0.5);
		// draw.drawRects(brfManager.getMergedDetectedFaces(), false, 2.0, 0xffd200, 1.0);

		var faces = brfManager.getFaces(); // default: one face, only one element in that array.

		
		
		 
		
		  
				 
		  

		for (var i = 0; i < faces.length; i++) {

			var face = faces[i];

			if (face.state === brfv4.BRFState.FACE_TRACKING) {
			
				document.getElementById('_drawing').style.display="block";
			document.getElementById('_imageData').style.display="block";
			document.getElementById('_faceSub').style.display="block";
			document.getElementById('_t3d').style.display="block";
			document.getElementById('_f3d').style.display="block";
			document.getElementById('_webcam').style.display="block";

				// simple blink detection

				// A simple approach with quite a lot false positives. Fast movement can't be
				// handled properly. This code is quite good when it comes to
				// staring contest apps though.

				// It basically compares the old positions of the eye points to the current ones.
				// If rapid movement of the current points was detected it's considered a blink.

				var v = face.vertices;

				if (_oldFaceShapeVertices.length === 0) storeFaceShapeVertices(v);

				var k, l, yLE, yRE;

				// Left eye movement (y)

				for (k = 36, l = 41, yLE = 0; k <= l; k++) {
					yLE += v[k * 2 + 1] - _oldFaceShapeVertices[k * 2 + 1];
				}
				yLE /= 6;

				// Right eye movement (y)

				for (k = 42, l = 47, yRE = 0; k <= l; k++) {
					yRE += v[k * 2 + 1] - _oldFaceShapeVertices[k * 2 + 1];
				}

				yRE /= 6;

				var yN = 0;

				// Compare to overall movement (nose y)

				yN += v[27 * 2 + 1] - _oldFaceShapeVertices[27 * 2 + 1];
				yN += v[28 * 2 + 1] - _oldFaceShapeVertices[28 * 2 + 1];
				yN += v[29 * 2 + 1] - _oldFaceShapeVertices[29 * 2 + 1];
				yN += v[30 * 2 + 1] - _oldFaceShapeVertices[30 * 2 + 1];
				yN /= 4;

				var blinkRatio = Math.abs((yLE + yRE) / yN);

				if ((blinkRatio > 12 && (yLE > 0.4 || yRE > 0.4))) {

					
					// console.log("blink " + blinkRatio.toFixed(2) + " " + yLE.toFixed(2) + " " +
					// 	yRE.toFixed(2) + " " + yN.toFixed(2));
					if ((yLE > yRE+0.6) && !_blinked) {
						//console.log('Left ' + yLE.toFixed(2));
						document.getElementById("eyeClosed").innerHTML += " Left";
						console.log("LEFT: "+yLE+" Right: "+yRE+" Blink ratio: "+blinkRatio+" YN: " + yN.toFixed(2));
					}
					else if((yRE > yLE+0.6) && !_blinked) { 
						//console.log('Right ' + yRE.toFixed(2));
						document.getElementById("eyeClosed").innerHTML += "  Right"; 
						console.log("Left: "+yLE+" RIGHT: "+yRE+" Blink ratio: "+blinkRatio+" YN: " + yN.toFixed(2));
						}
						else if(!_blinked) { 
						
							document.getElementById("eyeClosed").innerHTML += "  Both"; 
							console.log("BOTH Left: "+yLE+" Right: "+yRE+" Blink ratio: "+blinkRatio+" YN: " + yN.toFixed(2));
							}
					
						
					blink();
				}
		
				// Let the color of the shape show whether you blinked.



			
				document.body.style.backgroundColor =  "white";
				document.getElementById("blink").innerHTML = "No Blinking";
				//document.getElementById("eyeClosed").innerHTML = " Eyes Open"; 

				if (_blinked) {
					
					document.getElementById("blink").innerHTML = "Blinked";
					document.body.style.backgroundColor =   getRandomColor();
					
				
				
			
			
				}

				// Face Tracking results: 68 facial feature points.

				

				storeFaceShapeVertices(v);
			}



		else  {
			document.getElementById('_drawing').style.display="none";
			document.getElementById('_imageData').style.display="none";
			document.getElementById('_faceSub').style.display="none";
			document.getElementById('_t3d').style.display="none";
			document.getElementById('_f3d').style.display="none";
			document.getElementById('_webcam').style.display="none";
		
			document.getElementById("blink").innerHTML = "CAN'T DETECT YOUR FACE";
			
		}



		}
	};

	function blink() {
		_blinked = true;

		if (_timeOut > -1) { clearTimeout(_timeOut); }

		_timeOut = setTimeout(resetBlink, 400);
	}

	function resetBlink() {
		
		_blinked = false;
	}

	function storeFaceShapeVertices(vertices) {
		for (var i = 0, l = vertices.length; i < l; i++) {
			_oldFaceShapeVertices[i] = vertices[i];
		}
	}

	var _oldFaceShapeVertices = [];
	var _blinked = false;
	var _timeOut = -1;

	// brfv4Example.dom.updateHeadline("BRFv4 - advanced - face tracking - simple blink detection.\n" +
	// 	"Detects a blink of the eyes: ");

	// brfv4Example.dom.updateCodeSnippet(exampleCode + "");
})();