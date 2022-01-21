import { Texture, ImageLoader, DefaultLoadingManager, RGBAFormat, RGBFormat } from 'three';

function TextureAtlasLoader(manager) {
  this.manager = manager || DefaultLoadingManager;
}

Object.assign(TextureAtlasLoader.prototype, {
  crossOrigin: "Anonymous",
  tileWidth: 16,
  tileHeight: 16,

  load: function(url, onLoad, onProgress, onError) {
    let self = this;

    let loader = new ImageLoader(this.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setPath(this.path);

    let atlas = new TextureAtlas();

    loader.load(url, function(image) {
      let isJPEG = url.startsWith("data:image/jpeg") || url.endsWith(".jpg") || url.endsWith(".jpeg");
      let extractCanvas = document.createElement("canvas");
      atlas.setAtlasSize(Math.floor(image.width / self.tileWidth), Math.floor(image.height / self.tileHeight));

      for (let y = 0; y < Math.floor(image.height / self.tileHeight); y ++) {
        for (let x = 0; x < Math.floor(image.width / self.tileWidth); x ++) {
          let textureImage = extractImage(image, x*self.tileWidth, y*self.tileHeight, self.tileWidth, self.tileHeight, isJPEG, extractCanvas);
          let texture = new Texture();
          texture.format = isJPEG ? RGBFormat : RGBAFormat;
          texture.image = textureImage;
          texture.needsUpdate = true;

          atlas.setTexture(x, y, texture);
        }
      }
      
      if (onLoad) {
        onLoad(atlas);
      }
    }, onProgress, onError);

    return atlas;
  },

  setCrossOrigin: function(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  },

  setPath: function(path) {
    this.path = path;
    return this;
  },

  setTileWidth: function(width) {
    this.tileWidth = width;
    return this;
  },

  setTileHeight: function(height) {
    this.tileHeight = height;
    return this;
  }
});

function TextureAtlas() {
  this.textures = new Array(new Array());
}

Object.assign(TextureAtlas.prototype, {
  setAtlasSize: function(width, height) {
    this.textures = new Array(height);
    for (let y = 0; y < height; y++) {
      this.textures[y] = new Array(width);
    }
  },

  setTexture: function(x, y, texture) {
    this.textures[y][x] = texture;
  },

  getTexture: function(x, y) {
    if (y >= 0 && y < this.textures.length) {
      if (x >= 0 && x < this.textures[y].length) {
        return this.textures[y][x];
      }
    }

    return null;
  }
});

function extractImage(image, x, y, width, height, isJPEG, canvas) {
  canvas.width = width;
  canvas.height = height;

  let graphics = canvas.getContext("2d");
  graphics.drawImage(
    image,
    x, y,
    width, height,
    0, 0,
    width, height
  );

  let result = document.createElement("img");
  result.width = width;
  result.height = height;
  result.src = canvas.toDataURL(isJPEG ? "image/jpeg" : "image/png");

  return result;
}

export { TextureAtlas, TextureAtlasLoader };
