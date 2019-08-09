




$(document).ready(function() {
  const video = $('#webcam')[0];
  const overlay = $('#overlay')[0];
  const overlayCC = overlay.getContext('2d');
  const ctrack = new clm.tracker();
  ctrack.init();

  function getRightEyeRectangle(positions) {
    const minX = positions[23][0] - 5;
    const maxX = positions[25][0] + 5;
    const minY = positions[24][1] - 5;
    const maxY = positions[26][1] + 5;

    const width = maxX - minX;
    const height = maxY - minY;

    return [minX, minY, width, height];
  }

  function getEyeRectangle(positions) {
    const minX = positions[23][0] - 5;
    const maxX = positions[28][0] + 5;
    const minY = positions[24][1] - 5;
    const maxY = positions[26][1] + 5;

    const width = maxX - minX;
    const height = maxY - minY;

    return [minX, minY, width, height];
  }

  function getLeftEyeRectangle(positions) {
    const minX = positions[30][0] - 5;
    const maxX = positions[28][0] + 5;
    const minY = positions[29][1] - 5;
    const maxY = positions[31][1] + 5;

    const width = maxX - minX;
    const height = maxY - minY;

    return [minX, minY, width, height];
  }

  function trackingLoop() {
    // Check if a face is detected, and if so, track it.
    requestAnimationFrame(trackingLoop);
    let currentPosition = ctrack.getCurrentPosition();

    overlayCC.clearRect(0, 0, 400, 300);
    if (currentPosition) {
      // Draw facial mask on overlay canvas:
      ctrack.draw(overlay);

      // Get the eyes rectangle and draw it in red:
      const rightEyeRect = getRightEyeRectangle(currentPosition);
      const leftEyeRect = getLeftEyeRectangle(currentPosition);
      //const eyesRect = getEyeRectangle(currentPosition);
    
      overlayCC.strokeStyle = 'red';

      overlayCC.strokeRect(leftEyeRect[0], leftEyeRect[1], leftEyeRect[2], leftEyeRect[3]);
      overlayCC.strokeRect(rightEyeRect[0], rightEyeRect[1], rightEyeRect[2], rightEyeRect[3]);

      // The video might internally have a different size, so we need these
      // factors to rescale the eyes rectangle before cropping:
      const resizeFactorX = video.videoWidth / video.width;
      const resizeFactorY = video.videoHeight / video.height;

      // Crop the eyes from the video and paste them in the eyes canvas:
      
      
      // const eyesCanvas = $('#eyes')[0];

      // const eyesCC = eyesCanvas.getContext('2d');

      // eyesCC.drawImage(
      //   video,
      //   eyesRect[0] * resizeFactorX,
      //   eyesRect[1] * resizeFactorY,
      //   eyesRect[2] * resizeFactorX,
      //   eyesRect[3] * resizeFactorY,
      //   0,
      //   0,
      //   eyesCanvas.width,
      //   eyesCanvas.height,
      // );
    

    // Crop the eyes from the video and paste them in the eyes canvas:
    const leftEyeCanvas = $('#leftEye')[0];

    const leftEyeCC = leftEyeCanvas.getContext('2d');

    leftEyeCC.drawImage(
      video,
      leftEyeRect[0] * resizeFactorX,
      leftEyeRect[1] * resizeFactorY,
      leftEyeRect[2] * resizeFactorX,
      leftEyeRect[3] * resizeFactorY,
      0,
      0,
      leftEyeCanvas.width,
      leftEyeCanvas.height,
    );
  



  // Crop the eyes from the video and paste them in the eyes canvas:
  const rightEyeCanvas = $('#rightEye')[0];

  const rightEyeCC = rightEyeCanvas.getContext('2d');

  rightEyeCC.drawImage(
    video,
    rightEyeRect[0] * resizeFactorX,
    rightEyeRect[1] * resizeFactorY,
    rightEyeRect[2] * resizeFactorX,
    rightEyeRect[3] * resizeFactorY,
    0,
    0,
    rightEyeCanvas.width,
    rightEyeCanvas.height,
  );

}
}

  function onStreaming(stream) {
    video.srcObject = stream;
    ctrack.start(video);
    trackingLoop();
  }

  navigator.mediaDevices
    .getUserMedia({
      video: true,
    })
    .then(onStreaming);

  // Track mouse movement:
  const mouse = {
    x: 0,
    y: 0,

    handleMouseMove: function(event) {
      // Get the mouse position and normalize it to [-1, 1]
      mouse.x = (event.clientX / $(window).width()) * 2 - 1;
      mouse.y = (event.clientY / $(window).height()) * 2 - 1;
    },
  };

  document.onmousemove = mouse.handleMouseMove;

  function getImage() {
    // Capture the current image in the eyes canvas as a tensor.
    return tf.tidy(function() {
      debugger
      const image = tf.browser.fromPixels($('#leftEye')[0]);

      // Add a batch dimension:
      const batchedImage = image.expandDims(0);
      // Normalize and return it:
      
      //debugger()
     
      return batchedImage
        .toFloat()
        .div(tf.scalar(127))
        .sub(tf.scalar(1));
    });
  }

  const dataset = {
    train: {
      n: 0,
      x: null,
      y: null,
    },
    val: {
      n: 0,
      x: null,
      y: null,
    },
  };

  function captureExample() {
    // Take the latest image from the eyes canvas and add it to our dataset.
    tf.tidy(function() {
      const image = getImage();
      const mousePos = tf.tensor1d([mouse.x, mouse.y]).expandDims(0);
      console.log(mousePos);
      // Choose whether to add it to training (80%) or validation (20%) set:
      const subset = dataset[Math.random() > 0.2 ? 'train' : 'val'];

      if (subset.x == null) {
        // Create new tensors
        subset.x = tf.keep(image);
        subset.y = tf.keep(mousePos);
      } else {
        // Concatenate it to existing tensor
        const oldX = subset.x;
        const oldY = subset.y;

        subset.x = tf.keep(oldX.concat(image, 0));
        subset.y = tf.keep(oldY.concat(mousePos, 0));
      }

      // Increase counter
      subset.n += 1;
      console.log(subset)
    });
  }

  $('body').keyup(function(event) {
    // On space key:
    if (event.keyCode == 32) {
      captureExample();

      event.preventDefault();
      return false;
    }
  });

  let currentModel;

  function createModel() {
    const model = tf.sequential();

    model.add(
      tf.layers.conv2d({
        kernelSize: 5,
        filters: 20,
        strides: 1,
        activation: 'relu',
        inputShape: [$('#leftEye').height(), $('#leftEye').width(), 1],
      }),
    );

    model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2],
      }),
    );

    model.add(tf.layers.flatten());

    model.add(tf.layers.dropout(0.2));

    // Two output values x and y
    model.add(
      tf.layers.dense({
        units: 2,
        activation: 'tanh',
      }),
    );

    // Use ADAM optimizer with learning rate of 0.0005 and MSE loss
    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
    });

    return model;
  }

  function fitModel() {
    let batchSize = Math.floor(dataset.train.n * 0.1);
    if (batchSize < 4) {
      batchSize = 4;
    } else if (batchSize > 64) {
      batchSize = 64;
    }

    if (currentModel == null) {
      currentModel = createModel();
    }

    currentModel.fit(dataset.train.x, dataset.train.y, {
      batchSize: batchSize,
      epochs: 20,
      shuffle: true,
      validationData: [dataset.val.x, dataset.val.y],
    });
  }

  $('#train').click(function() {
    fitModel();
  });

  // function moveTarget() {
  //   if (currentModel == null) {
  //     return;
  //   }
  //   tf.tidy(function() {
  //     const image = getImage();
  //     const prediction = currentModel.predict(image);

  //     // Convert normalized position back to screen position:
  //     const targetWidth = $('#target').outerWidth();
  //     const targetHeight = $('#target').outerHeight();
  //     const x =
  //       ((prediction.dataSync()[0] + 1) / 2) *
  //       ($(window).width() - targetWidth);
  //     const y =
  //       ((prediction.dataSync()[1] + 1) / 2) *
  //       ($(window).height() - targetHeight);

  //     // Move target there:
  //     const $target = $('#target');
  //     $target.css('left', x + 'px');
  //     $target.css('top', y + 'px');
  //   });
  // }


    function predictBlink() {
    if (currentModel == null) {
      return;
    }
    tf.tidy(function() {
      const image = getImage();
      const prediction = currentModel.predict(image);
      console.log(prediction.dataSync()[0]);
    });
  }
  setInterval(predictBlink, 100);
});
