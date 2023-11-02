import os
import math
from tqdm import tqdm
import json
import numpy as np


class Utils:
    def __init__(self, minScale=-25, maxScale=25):
        self.minScale = minScale
        self.maxScale = maxScale

    def normalize(self, embeddings):
        minX = min(embeddings, key=lambda x: x[0])[0]
        rangeX = max(embeddings, key=lambda x: x[0])[0] - minX
        minY = min(embeddings, key=lambda x: x[1])[1]
        rangeY = max(embeddings, key=lambda x: x[1])[1] - minY
        rangeScale = self.maxScale + 0.9999999999 - self.minScale
        for index, e in enumerate(embeddings):
            embeddings[index][0] =  (embeddings[index][0] - minX) / rangeX * rangeScale + self.minScale
            embeddings[index][1] = (embeddings[index][1] - minY) / rangeY * rangeScale + self.minScale
        return embeddings

    def center(self, embeddings):
        offsetA = (max(embeddings, key=lambda x: x[0])[0] + min(embeddings, key=lambda x: x[0])[0]) / 2
        offsetB = (max(embeddings, key=lambda x: x[1])[1] + min(embeddings, key=lambda x: x[1])[1]) / 2
        for index, e in enumerate(embeddings):
            embeddings[index][0] = embeddings[index][0] - offsetA
            embeddings[index][1] = embeddings[index][1] - offsetB
        return embeddings
    

    
    def write_metadata(directory, metadata, imageFileColumn):
        # rename metadata.imageFileColumn to metadata.filename
        metadata.rename(columns={imageFileColumn: "filename"}, inplace=True)
        metadata.reset_index(inplace=True)
        # save metadata file
        result = metadata.to_json(orient="records")
        with open(f'build/datasets/{directory}/metadata.json', "w") as f:
            f.write(result)
        print("saved metadata.json")

    def write_config(directory, title=None, description='', mappings=None, clusters=None, total=0, sliderSetting=None, infoColumns=None, searchFields=None, imageWebLocation=None, spriteRows=32, spriteNumb=None, squareSize=2048, spriteSize=64, spriteDir=None):
        configData = {}
        
        configData["title"] = title
        configData["datasetInfo"] = description

        configData["embeddings"] = mappings
        configData["clusters"] = clusters
        configData["total"] = total
        configData["sliders"] = sliderSetting
        if infoColumns:
            configData["info"] = infoColumns
        configData["search"] = searchFields
        configData["url_prefix"] = imageWebLocation
        configData["sprite_side"] = spriteRows
        if spriteDir:
            configData["sprite_dir"] = spriteDir
        else: 
            configData["sprite_dir"] = directory

        if spriteNumb:
            configData["sprite_number"] = spriteNumb
        else:
            # count files in sprite directory
            spriteNumb = 0
            for file in os.listdir(f'build/datasets/{configData["sprite_dir"]}'):
                if file.startswith("tile_"):
                    spriteNumb += 1
        configData["sprite_number"] = spriteNumb
        configData["sprite_image_size"] = spriteSize
        configData["sprite_actual_size"] = squareSize 

        with open(f'build/datasets/{directory}/config.json', 'w') as f:
            json.dump(configData, f, indent=4, cls=NumpyEncoder)
        print("saved config.json")


class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
    
    
class ImageSpriteGenerator:
    def __init__(self, directory, spriteSize=2048, spriteRows=32, imageFolder=None, files=None):
        self.directory = directory
        self.imageFolder = imageFolder
        self.files = files
        self.spriteSize = spriteSize
        self.spriteRows = spriteRows
        self.columns = spriteRows
        self.squareSize = int(spriteSize / spriteRows)
        self.imgPerSprite = spriteRows * spriteRows

    def generate(self):
        try:
            from PIL import Image
        except ImportError:
            print("Pillow is not installed. Please run: !pip install Pillow")

        def resizeImgSprite(image):
            (w, h) = image.size
            max_dim = max(w, h)
            new_w = int(w / max_dim * self.squareSize)
            new_h = int(h / max_dim * self.squareSize)
            x_dif = int((self.squareSize - new_w) / 2)
            y_dif = int((self.squareSize - new_h) / 2)
            new_w = max(9, new_w)
            new_h = max(9, new_h)
            return image.resize((new_w-8, new_h-8),Image.LANCZOS), new_w, new_h, x_dif, y_dif

        imgPerSprite = self.spriteRows*self.spriteRows
        self.numbSprites = math.ceil(len(self.files)/imgPerSprite)
        
        for spriteNum in tqdm(range(self.numbSprites), desc = "Generating sprites"):
            result = Image.new("RGBA", (self.spriteSize, self.spriteSize), (255, 0, 0, 0))
            for i in range(imgPerSprite):
                img_idx = i+(spriteNum*imgPerSprite)
                if img_idx >= len(self.files):
                    break
                entry = self.files[img_idx]
                try:
                    image = Image.open(os.path.join(self.imageFolder, entry))
                except:
                    print(f"Skipping invalid image file: {entry}")
                    continue
                resizedImage,w,h,x_dif,y_dif = resizeImgSprite(image)
                r_result = Image.new("RGBA", (w, h), (255, 0, 0, 0))
                r_inner = Image.new("RGBA", (w-4, h-4), (1, 1, 1, 1))   # produces an almost transparent border to indicate clusters in the tool
                r_result.paste(r_inner, (2,2))
                r_result.paste(resizedImage, (4,4))
                x = i % self.spriteRows * self.squareSize + x_dif
                y = i // self.spriteRows * self.squareSize + y_dif
                result.paste(r_result, (x, y, x + w, y + h))
            result = result.resize((self.spriteSize, self.spriteSize), Image.LANCZOS)  # Use LANCZOS filter for better image quality
            
            # convert to 256 colors for faster loading online
            result = result.convert("P", palette=Image.WEB, dither=Image.FLOYDSTEINBERG)           
            result.save(f'build/datasets/{self.directory}/tile_{spriteNum}.png', "PNG", optimize=True) 
            
             
class SimplePlot:
    def __init__(self, directory, A=None ,B=None, metadata=None):
        self.directory = directory
        self.makePlot(A,B, metadata)

    def makePlot(self, A,B, metadata):
        plot = metadata[[A,B]]
        normalizedPlot = Utils().normalize(plot.values)
        print("normalized plot")
        centeredEmbedding = Utils().center(normalizedPlot)
        print("centered embedding")
        self.filename = (A + "_" + B).replace(" ","")
        # save file
        with open(f'build/datasets/{self.directory}/{self.filename}.json', "w") as out_file:
            out = json.dumps(centeredEmbedding, cls=NumpyEncoder)
            out_file.write(out)

        print(f"saved {self.filename}.json")
        return {"name": self.filename, "file": self.filename + ".json"}

class PCAGenerator:
    # See PCA documentation: https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.eA.html
    def __init__(self, directory, scale=True, data=None, components=3):
        self.directory = directory
        self.data = data
        self.components = components
        self.scale = scale

    def generate(self):
        try:
            from sklearn.decomposition import PCA
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            print("sklearn is not installed. Please run: !pip install sklearn")

        print("Performing PCA...")
        x = StandardScaler().fit_transform(self.data)
        pca = PCA(n_components=self.components)
        embedding = pca.fit_transform(x)
        if self.scale:
            normalized = Utils().normalize(embedding)
            centeredEmbedding = Utils().center(normalized)
        else:
            centeredEmbedding = embedding
        print("...done")
        PCMap = centeredEmbedding.reshape(-1,2)
        # save file
        with open(f'build/datasets/{self.directory}/PCA.json', "w") as out_file:
            out = json.dumps(PCMap, cls=NumpyEncoder)
            out_file.write(out)
        print(f"saved PCA.json")
        return centeredEmbedding


class UMAPGenerator:    
    def __init__(self, directory, data=None, n_neighbors=15, min_dist=0.18, metric="correlation", verbose=True):
        self.directory = directory
        self.data = data
        self.n_neighbors = n_neighbors
        self.min_dist = min_dist
        self.metric = metric
        self.verbose = verbose

    def generate(self):
        try:
            import umap
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            print("umap is not installed. Please run: !pip install umap-learn")

        print("Generating UMAP...")
        scaled_penguin_data = StandardScaler().fit_transform(self.data)
        reducer = umap.UMAP(n_neighbors=self.n_neighbors,
                            min_dist=self.min_dist,
                            metric=self.metric,
                            verbose=self.verbose)
        embedding = reducer.fit_transform(scaled_penguin_data)
        normalized = Utils().normalize(embedding)
        centeredEmbedding = Utils().center(normalized)
        print("...done")
        # save file
        with open(f'build/datasets/{self.directory}/UMAP.json', "w") as out_file:
            out = json.dumps(centeredEmbedding, cls=NumpyEncoder)
            out_file.write(out)
        print(f"saved UMAP.json")

class TSNEGenerator:
    def __init__(self, directory, data=None, n_components=2, verbose=1, random_state=123):
        self.directory = directory
        self.data = data
        self.n_components = n_components
        self.verbose = verbose
        self.random_state = random_state

    def generate(self):
        try:
            from sklearn.manifold import TSNE
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            print("sklearn is not installed. Please run: !pip install sklearn")
            
        print("Generating t-SNE...")
        x = StandardScaler().fit_transform(self.data)
        tsne = TSNE(n_components=self.n_components, verbose=self.verbose, random_state=self.random_state)
        embedding = tsne.fit_transform(x)
        normalized = Utils().normalize(embedding)
        centeredEmbedding = Utils().center(normalized)
        print("...done")
        # save file
        with open(f'build/datasets/{self.directory}/TSNE.json', "w") as out_file:
            out = json.dumps(centeredEmbedding, cls=NumpyEncoder)
            out_file.write(out)
        print(f"saved TSNE.json")
    

class HistogramGenerator:
    def __init__(self, directory, data=None, selection=None, bucketCount = 50):
        self.directory = directory
        self.data = data
        self.selection = selection
        self.bucketCount = bucketCount

    def prepareBuckets(self, MIN, MAX, data):
        # prepare Slider Bar Historgram
        buckets = {}
        bucketsSize = {}
        if (MIN < 0):
            stepSize = (abs(MIN) + abs(MAX)) / self.bucketCount
        else:
            stepSize = abs((abs(MIN) - abs(MAX)) / self.bucketCount)
        for i in range(0, self.bucketCount):
            buckets[i] = []
            bucketsSize[i] = 0
        for index, e in enumerate(data):
            if (e == MAX):
                targetBucket = self.bucketCount-1
            try:
                targetBucket = math.floor((e - MIN) / stepSize)
                buckets[targetBucket].append(index)
                bucketsSize[targetBucket]+=1
            except:
                pass
                
        return {"histogram":list(bucketsSize.values()), "selections":list(buckets.values()), "range":[int(MIN),int(MAX)]}

    def generate(self):
        bucketData =  {} 
        for element in self.selection:
            print("preparing Slider Bar Historgram data", element)
            bucketData[element] = {str(element):{"histogram":[], "selections":[]}}
            bucketData[element] = self.prepareBuckets(self.data[element].min(), self.data[element].max(), self.data[element].values.tolist())
        
        with open(f'build/datasets/{self.directory}/barData.json', "w") as f:
            json.dump(bucketData , f)
        print(f'saved barData.json')
