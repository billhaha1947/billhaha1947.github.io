var settings = {
  particles: {
    length: 500,
    duration: 2,
    velocity: 100,
    effect: -0.75,
    size: 30,
  },
};

(function() {
  let b = 0;
  let c = ["ms", "moz", "webkit", "o"];
  for (let a = 0; a < c.length && !window.requestAnimationFrame; ++a) {
    window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"];
    window.cancelAnimationFrame = window[c[a] + "CancelAnimationFrame"]
      || window[c[a] + "CancelRequestAnimationFrame"];
  }
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 1000 / 60);
    };
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
})();

var Point = (function() {
  function Point(x, y) {
    this.x = typeof x !== 'undefined' ? x : 0;
    this.y = typeof y !== 'undefined' ? y : 0;
  }
  Point.prototype.clone = function() {
    return new Point(this.x, this.y);
  };
  return Point;
})();

var Particle = (function() {
  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }
  Particle.prototype.initialize = function(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
  };
  Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };
  Particle.prototype.draw = function(ctx, image) {
    function ease(t) {
      return (--t) * t * t + 1;
    }
    var size = image.width * ease(this.age / settings.particles.duration);
    ctx.globalAlpha = 1 - this.age / settings.particles.duration;
    ctx.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
  };
  return Particle;
})();

var ParticlePool = (function() {
  var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;
  function ParticlePool(length) {
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++)
      particles[i] = new Particle();
  }
  ParticlePool.prototype.add = function(x, y, dx, dy) {
    particles[firstFree].initialize(x, y, dx, dy);
    firstFree++;
    if (firstFree === particles.length) firstFree = 0;
    if (firstActive === firstFree) firstActive++;
    if (firstActive === particles.length) firstActive = 0;
  };
  ParticlePool.prototype.update = function(deltaTime) {
    var i;
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].update(deltaTime);
      for (i = 0; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    while (particles[firstActive].age >= duration && firstActive !== firstFree) {
      firstActive++;
      if (firstActive === particles.length) firstActive = 0;
    }
  };
  ParticlePool.prototype.draw = function(ctx, image) {
    if (firstActive < firstFree) {
      for (var i = firstActive; i < firstFree; i++)
        particles[i].draw(ctx, image);
    }
    if (firstFree < firstActive) {
      for (var i = firstActive; i < particles.length; i++)
        particles[i].draw(ctx, image);
      for (var i = 0; i < firstFree; i++)
        particles[i].draw(ctx, image);
    }
  };
  return ParticlePool;
})();

(function(canvas) {
  var ctx = canvas.getContext('2d');
  var pool = new ParticlePool(settings.particles.length);
  var particleRate = settings.particles.length / settings.particles.duration;
  var time;

  function pointOnHeart(t) {
    return new Point(
      160 * Math.pow(Math.sin(t), 3),
      130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
    );
  }

  var image = (function() {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.width = settings.particles.size;
    canvas.height = settings.particles.size;

    var to = canvas.width / 2,
        gradient = ctx.createRadialGradient(to, to, 0, to, to, to);
    gradient.addColorStop(0, "rgba(255, 0, 128, 1)");
    gradient.addColorStop(1, "rgba(255, 0, 128, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(to, to, to, 0, Math.PI * 2);
    ctx.fill();

    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
  })();

  function render() {
    requestAnimationFrame(render);
    var newTime = new Date().getTime() / 1000;
    var deltaTime = newTime - (time || newTime);
    time = newTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone();
      dir.x *= Math.random() * 0.02;
      dir.y *= Math.random() * 0.02;
      pool.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
    }

    pool.update(deltaTime);
    pool.draw(ctx, image);
  }

  function onResize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.onresize = onResize;

  setTimeout(function() {
    onResize();
    render();
  }, 10);
})(document.getElementById("pinkboard"));