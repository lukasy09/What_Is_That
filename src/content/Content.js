import React from 'react';
import "./Content.css";
import * as tf from '@tensorflow/tfjs';
import Converter from '../utils/Converter';
import StyleManager from '../utils/StyleManager';
import LoadingScreen from './LoadingScreen';
import MnistView from './mnistView/MnistView';

export default class Content extends React.Component {

    constructor(props) {
        super(props);
        this.img = new Image();

        this.state = {
            loadedData: false,
            result: '',
            videoView: false,
            isModelLoaded: false,
            showGraph: false,
            classificationModel: true,
            mnistModel : false,
        }}

    componentWillMount() {
        this.loadModel().then(()=> this.setState({isModelLoaded:true}));
    }

    render() {
        if(this.state.classificationModel) {
                return (
                    this.state.isModelLoaded ?
                        <div className="Content-box" style={{width: window.innerWidth, height: window.innerHeight}}>

                            <div className={"Input-box"} style={{width: window.innerWidth / 3, height: window.innerHeight}}>
                                    <p onClick={()=>this.switchModel()}>MNIST</p>
                                    <input id="file" className={"Image-input"}
                                           onChange={(e) => {this.onImageUpload(e)}} type='file' title="Yes, Click it!"/>
                                    <label htmlFor={"file"} className={"Image-input-label"}>Choose a file</label>
                            </div>

                            <div className={"Image-box"}>
                               <div className={"Canvas-wrapper"}>
                                    <canvas ref={"canvas"} height={600} width={600}> </canvas>
                                    <span>Prediction:{this.state.result}</span>
                               </div>
                                <div className={"Button-wrapper"}>
                                    <button onClick={() => this.get_prediction()}>Predict</button>
                                </div>
                            </div>
                        </div> : <LoadingScreen/>);
        }else{
            return(<MnistView/>)
        }
    }


    componentDidMount() {
        this.img.addEventListener('load', this.drawImageToCanvas);
    }


    onImageUpload = (event) => {
        const file = event.target.files[0];

        if(file) {
            this.img.src = URL.createObjectURL(file);
            this.setState({
                loadedData: true
            });
        }
    };

    drawImageToCanvas = () => {
        let canvas = this.refs.canvas;
        let ctx = canvas.getContext("2d");
        const maxWidth = ctx.canvas.width;
        const maxHeight = ctx.canvas.height;

        const ratio = this.img.naturalWidth / this.img.naturalHeight;

        if(this.img.naturalWidth <= maxWidth && this.img.naturalHeight <= maxHeight){
            ctx.canvas.width = this.img.naturalWidth;
            ctx.canvas.height = this.img.naturalHeight;
            ctx.drawImage(this.img, 0, 0, this.img.naturalWidth, this.img.naturalHeight);
        }else{
            if(this.img.naturalWidth > maxWidth && this.img.naturalHeight < maxHeight){
                ctx.canvas.width = maxWidth;
                ctx.canvas.height = this.img.naturalHeight / ratio;
                ctx.drawImage(this.img, 0, 0, maxWidth, this.img.naturalHeight / ratio);
            }else if(this.img.naturalWidth < maxWidth && this.img.naturalHeight > maxHeight){
                ctx.canvas.width = this.img.naturalWidth / ratio;
                ctx.canvas.height =maxHeight;
                ctx.drawImage(this.img, 0, 0, this.img.naturalWidth / ratio, maxHeight);
            }else{
                ctx.drawImage(this.img, 0, 0, maxWidth, maxHeight);
            }
        }}


    ;


    /**
     * Loading the pre-trained model.
     * @returns {Promise<void>}
     */
    async loadModel() {

         this.model = await tf.loadModel("https://raw.githubusercontent.com/lukasy09/KernelBase.py/master/Objects/src/models/model_40.json/model.json");
    };

    /**
     * Getting image data from canvas&preparing data for prediction&predicting.
     */
    async get_prediction (){

        if (this.state.loadedData) {

            await tf.tidy(()=> {
                let canvas = this.refs.canvas;
                let ctx = canvas.getContext("2d");
                let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

                let pixels = tf.fromPixels(imageData, 3);

                let resized= tf.image.resizeBilinear(pixels,[200,200]);

                let batched = resized.expandDims(0);
                batched = batched.toFloat().div(tf.scalar(255));

                const output = this.model.predict(batched);
                let data = Array.from(output.dataSync());

                let results = Converter.convertToArray(data);
                let str = Converter.mapToStr(results);
                this.setState({
                    result: str
                })
            });
        }};


    /**
     * Allows to switch models
     */
    switchModel = ()=>{
        if(!this.state.mnistModel){
            this.setState({
                mnistModel : true,
                classificationModel : false});
               }
    };

}