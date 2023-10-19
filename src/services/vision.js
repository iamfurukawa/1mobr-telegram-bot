const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

module.exports = {
  hasFace: async (imageUrl) => {
    const credentials = new ApiKeyCredentials({
      inHeader: { 'Ocp-Apim-Subscription-Key': process.env.VISION_API_KEY },
    });
    const client = new ComputerVisionClient(credentials, process.env.VISION_URL);
    const result = await client.analyzeImage(imageUrl, { visualFeatures: ['Faces'] });

    console.log(result);
    return result.faces.length > 0;
  }
};
