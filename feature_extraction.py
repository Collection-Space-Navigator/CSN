import os
from pathlib import Path

from tensorflow.keras import applications, models, Model
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from tqdm.notebook import tqdm
from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
IMG_EXTS = ['jpg', 'jpeg', 'bmp', 'png']

def named_model(name):
    # include_top=False removes the fully connected layer at the end/top of the network
    # This allows us to get the feature vector as opposed to a classification
    if name == 'ResNet50':
        return applications.resnet50.ResNet50(weights='imagenet', include_top=False, pooling='avg')
    
    elif name == 'Xception':
        return applications.xception.Xception(weights='imagenet', include_top=False, pooling='avg')

    elif name == 'VGG16':
        return applications.vgg16.VGG16(weights='imagenet', include_top=False, pooling='avg')

    elif name == 'VGG19':
        return applications.vgg19.VGG19(weights='imagenet', include_top=False, pooling='avg')

    elif name == 'InceptionV3':
        return applications.inception_v3.InceptionV3(weights='imagenet', include_top=False, pooling='avg')

    elif name == 'MobileNet':
        return applications.mobilenet.MobileNet(weights='imagenet', include_top=False, pooling='avg')
    
    else:
        raise ValueError('Unrecognised model: "{}"'.format(name))

def _extract(fp, model):
        # Load the image, setting the size to 224 x 224
        img = image.load_img(fp, target_size=(224, 224))
        
        # Convert the image to a numpy array, resize it (1, 224, 224, 3), and preprocess it
        img_data = image.img_to_array(img)
        img_data = np.expand_dims(img_data, axis=0)
        img_data = preprocess_input(img_data)

        # Extract the features
        np_features = model.predict(img_data, verbose=0)[0]

        
        # Convert from Numpy to a list of values
        return np.char.mod('%f', np_features)


def extract_features(filepaths, model='ResNet50', write_to=None, recursive=False):
    ''' Reads a list of input image filepaths and returns
    the resulting extracted features. Use write_to=<some_filepath> to save the
    features somewhere. '''
    
    print('Extracting features')
    
    # Get the model
    print('Acquiring model "{}"'.format(model))
    
    if type(model) == str:
        
        # From filepath
        if os.path.exists(model):
            print('Assuming model argument is a filepath')
            m = models.load_model(model)
        
        # From standard named models
        else:
            print('Assuming model argument is a named model')
            m = named_model(model)
            
    # Model already in memory
    else:
        print('Assuming model argument is a loaded model')
        m = model
        
    assert isinstance(m, Model), 'Model \'{}\' is not a tf.keras.Model'.format(model)
    print('\rSuccessfully acquired model\t\t\t\t\t')
    
    # Get the image filepaths
    img_fps = [fp.replace('\\', '/') for fp in filepaths]

    # And the image filenames
    img_fns = [fp.replace('\\', '/').rsplit('/', 1)[-1] for fp in img_fps]
    
    print('Found {} images'.format(len(img_fns)))
    
    # Run the extraction over each image
    features = []
    
    for i, fp in enumerate(tqdm(img_fps)):

        # print('\rProcessing: {:.2f}%\t\t'.format((i+1) / len(img_fps) * 100), end='', flush=True)
        features.append(_extract(fp, m))
    print('\nSuccess')
    
    return features, img_fns
