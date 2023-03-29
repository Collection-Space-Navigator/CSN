import os
import math
from PIL import Image
from tqdm import tqdm


class ImageTileGenerator:
    def __init__(self, tileSize=2048, tileRows=32):
        self.tileSize = tileSize
        self.tileRows = tileRows
        self.columns = tileRows
        self.squareSize = int(tileSize / tileRows)
        self.imgPerTile = tileRows * tileRows

    def resizeImgTile(self, image):
        (w, h) = image.size
        max_dim = max(w, h)
        new_w = int(w / max_dim * self.squareSize)
        new_h = int(h / max_dim * self.squareSize)
        x_dif = int((self.squareSize - new_w) / 2)
        y_dif = int((self.squareSize - new_h) / 2)
        return image.resize((new_w - 8, new_h - 8), Image.ANTIALIAS), new_w, new_h, x_dif, y_dif

    def generateTiles(self, ImgPaths, directory, IMAGE_FOLDER):
        os.makedirs(directory, exist_ok=True)
        # Parameters for tiles
        squareSize = int(self.tileSize/self.tileRows)
        imgPerTile = self.tileRows*self.tileRows
        numbTiles = math.ceil(len(ImgPaths)/imgPerTile)
        
        for tileNum in tqdm(range(numbTiles), desc = "Generating tiles"):
            result = Image.new("RGBA", (self.tileSize, self.tileSize), (255, 0, 0, 0))
            for i in range(imgPerTile):
                img_idx = i+(tileNum*imgPerTile)
                if img_idx >= len(ImgPaths):
                    break
                entry = ImgPaths[img_idx]
                try:
                    image = Image.open(os.path.join(IMAGE_FOLDER, entry))
                except:
                    print(f"Skipping invalid image file: {entry}")
                    continue
                resizedImage,w,h,x_dif,y_dif = self.resizeImgTile(image, squareSize)
                r_result = Image.new("RGBA", (w, h), (1, 1, 1, 1))   # produces an almost transparent border to indicate clusters in the tool
                r_result.paste(resizedImage, (4,4))
                x = i % self.tileRows * squareSize + x_dif
                y = i // self.tileRows * squareSize + y_dif
                result.paste(r_result, (x, y, x + w, y + h))
            result = result.resize((self.tileSize, self.tileSize), Image.ANTIALIAS)
            # convert to 256 colors for faster loading online
            result = result.convert("P", palette=Image.ADAPTIVE, colors=256)
            result.save(f'{directory}/tile_{tileNum}.png', "PNG", optimize=True)    

# mappings = []
# minScale = -25
# maxScale = 25

# def normalize(embeddings):
#     minX = min(embeddings, key=lambda x: x[0])[0]
#     rangeX = max(embeddings, key=lambda x: x[0])[0] - minX
#     minY = min(embeddings, key=lambda x: x[1])[1]
#     rangeY = max(embeddings, key=lambda x: x[1])[1] - minY
#     rangeScale = maxScale + 0.9999999999 - minScale
#     for index, e in enumerate(embeddings):
#         embeddings[index][0] =  (embeddings[index][0] - minX) / rangeX * rangeScale + minScale
#         embeddings[index][1] = (embeddings[index][1] - minY) / rangeY * rangeScale + minScale
#     return embeddings

# def centerEmbeddings(embeddings):
#     offsetA = (max(embeddings, key=lambda x: x[0])[0] + min(embeddings, key=lambda x: x[0])[0]) / 2
#     offsetB = (max(embeddings, key=lambda x: x[1])[1] + min(embeddings, key=lambda x: x[1])[1]) / 2
#     for index, e in enumerate(embeddings):
#         embeddings[index][0] = embeddings[index][0] - offsetA
#         embeddings[index][1] = embeddings[index][1] - offsetB
#     return embeddings
    
# class NumpyEncoder(json.JSONEncoder):
#     """ Special json encoder for numpy types """
#     def default(self, obj):
#         if isinstance(obj, np.integer):
#             return int(obj)
#         elif isinstance(obj, np.floating):
#             return float(obj)
#         elif isinstance(obj, np.ndarray):
#             return obj.tolist()
#         return json.JSONEncoder.default(self, obj)
    
# class Projections:
