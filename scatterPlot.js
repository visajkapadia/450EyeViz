//global variables
var mergedData;
var xMin,xMax,yMin,yMax;
var durationMin,durationMax,pupilMin,pupilMax,timeMin,timeMax;
//scales
var xScale, yScale, timeScale;
var rScale = d3.scaleLinear()
    .range([3,23]);
var colorScale = d3.scaleLinear()
    .range(['#0066ff', '#d0ff00', '#f00000'])
    .interpolate(d3.interpolateHcl);;
//svg
var svg, svgDiv, svgHeight, svgWidth;

//sliders
var timeSlider = d3.select('#timeRange');
var timeLabel = d3.select('#timeLabel');
function timeUpdate(val) {
    timeLabel.text(val+'s');
}
var durationSlider = d3.select('#durationSlider');
var pupilSlider = d3.select('#pupilSlider');

var basicOpacity = 0.8;
var highlightOpacity = 0.8;
var mutedOpacity = 0.01;


// Initial document setup
document.addEventListener('DOMContentLoaded', function(){
    console.log('DOM content loaded. Initiating all setups.');
    
    //setting global vars and drawing csv
    svgDiv = document.getElementById("svgDiv");
    svgWidth = +svgDiv.offsetWidth;
    svgHeight = +svgDiv.offsetHeight;

    // TODO: make svg in index.html and adjust size
    svg = d3.select("#svgDiv")
        .append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("id", "drawnSvg");
    svg.append('g').attr('id','plotG');
    svg.append('g').attr('id','guideG');

    drawLegends();
    fetchCsvCallOthers();
});

document.addEventListener('dblclick', clearAllFilters);


// Fetches the csv, calls other functions
function fetchCsvCallOthers()
{
    console.log('fetching csv data.');

    var drawnSvg = document.getElementById("drawnSvg");
    //removing previously drawn circles
    if(drawnSvg != undefined) {
        d3.select('#svgDiv').select('#plotG').selectAll('*').remove();
        d3.select('#svgDiv').select('#guideG').selectAll('*').remove();
    }
    var file = dataSetToLoad();
    d3.csv(file)
    .then(function(data){
        //converting all rows to int
        data.forEach(function(d) {
            d.time = +d.time;
            d.duration = +d.duration;
            d.x = +d.x;
            d.y = +d.y;
            d.avg_dilation = +d.avg_dilation;
        });
        mergedData = data;
        setScales(mergedData);  
        drawCircles(mergedData);
    });
}

// Returns file by checking which data set to load from radio buttons
function dataSetToLoad()
{
    if(document.getElementById("treeRadio").checked) {
        console.log('tree data selected.');
        return "./data_preprocessed/merged_tree.csv";
    } else {
        console.log('graph data selected.');
        return "./data_preprocessed/merged_graph.csv";
    }
}

// Sets the scales for x, y coordinates, duration and avg_dilation
function setScales(data)
{
    console.log('setting scales.');

    const xValue = d => d.x;
    const yValue = d => d.y;
    const durationValue = d => d.duration;   // plot size
    const pupilValue = d => d.avg_dilation;  // plot color
    const timeValue = d => d.time;

    xMax = d3.max(data, xValue);
    xMin = d3.min(data, xValue);
    console.log('x '+xMin+' : '+xMax);
    yMax = d3.max(data, yValue);
    yMin = d3.min(data, yValue);
    console.log('y '+yMin+' : '+yMax);
    durationMax = d3.max(data, durationValue);
    durationMin = d3.min(data, durationValue);
    console.log('duration '+durationMin+' : '+durationMax);
    pupilMax = d3.max(data, pupilValue);
    pupilMin = d3.min(data, pupilValue);
    console.log('pupil '+pupilMin+' : '+pupilMax);
    timeMax = d3.max(data, timeValue);
    timeMin = d3.min(data, timeValue);
    console.log('time '+timeMin+' : '+timeMax);

    xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0+20, svgWidth-50])
        .nice();
    yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([0+20, svgHeight-50])
        .nice();
    rScale.domain([100, durationMax]).nice();
    colorScale.domain([0, 0.3, 1]);     //fixed with exagerated changes
        // .domain([0, (pupilMin+pupilMax)/2, pupilMax])   //show the distribution as it is
        // .domain([0, pupilMax*0.4, pupilMax])            //bit distorted
    timeScale = d3.scaleLinear()
        .domain([timeMin, timeMax])
        .range([0, 10])
        .nice();
        
    timeSlider.attr('max',timeMax/1000);    //set time slider range
}

// Draws circle points
function drawCircles(data)
{
    console.log('drawing circles.');

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");
        
    var plotG = svg.select('#plotG');
    // Bind data to circles
    var plots = plotG.selectAll("circle")
        .data(data, function(d) { return d; }); //semantic binding
    // Add circles
    plots.enter().append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => rScale(d.duration))
        .attr("fill", d => colorScale(d.avg_dilation))
        .attr("visibility","hidden")
        .on('mouseover', function(d, i) {
            const msg = "<b>time</b> " + (d.time/1000).toFixed(2) + "s <br>"
                      + "<b>duration</b> " + d.duration + "ms <br>"
                      + "<b>dilation</b> " + d.avg_dilation.toFixed(2) + "mm";
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
            d3.select('#details').html(msg);
        })
        .on("mousemove", function(d, i) {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                    .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i){
            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        })
        .transition()
        .delay(function(d, i){
            // console.log(d.time/1000);
            // timeSlider.attr('value',d.time/1000);
            // timeUpdate(d.time/1000);
            return timeScale(i*d.time);
        })
        .attr("visibility", "visible");
        // .transition().duration( (d,i) => {
        //     return timeScale(i*d.duration);
        // })
        // .attr('r', rScale(d.duration));

        // console.log('Drawing Done!');
}

// TODO: Filter with a range of values (double thumbs on the slider)
// Filters plots by feature
function filterByFeature(feature, val, step)
{
    if ( !(feature=='duration' || feature=='avg_dilation') ) {
        console.log('not existing feature '+feature);
        return;
    }
    var selected = +val;
    var inclusiveVal = step/2;
    var start = selected - inclusiveVal;
    var end = selected + inclusiveVal;
    console.log(`filtering by ${feature} ${start.toFixed(3)} ~ ${end.toFixed(3)}`);

    // Make selected data stand out
    svg.select('#plotG').selectAll('circle')
    .style('opacity', mutedOpacity)
    .filter(function(d) {
        return (d[feature] >= start) && (d[feature] <= end);
    })
    .style('opacity', highlightOpacity);
    
}

// Removes filter effect when double clicked on document
function clearAllFilters() { 
    console.log('clearing all filters.');
    // alert('document double clicked!');
    svg.selectAll('circle')
    .style('opacity', basicOpacity);
};

// Draws legends with circles and scales under sliders
function drawLegends()
{
    console.log('drawing svg under legends.');
    const sliderLength = 120;
    const gOffset = { x:25, y:25 };
    const scaleX = d3.scaleLinear().range([0, sliderLength]);

    // 1. Fixation Duration Legend
    const durationG = d3.select('#svgDurationSlider').append('g')
        .attr('transform',`translate(${gOffset.x},${gOffset.y})`);
    const durCircles = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const durStepDots = [0, 0.5, 1, 1.5, 2];
    const durStepTexts = [0, 1, 2];
    scaleX.domain([0, d3.max(durCircles)]);
    const scaleSize = rScale.domain([0, 2]);
    //back circles
    durationG.selectAll('circle')
        .data(durCircles).enter().append('circle')
        .attr('cx', d => scaleX(d))
        .attr('r', d => scaleSize(d))  //the size legend
        .style('fill', '#CCC');
    //lines for the slider
    durationG.append('line').attr('x2',sliderLength);
    durationG.insert('g').attr('class','steps')
        .selectAll('circle')
        .data(durStepDots).enter().append('circle')
        .attr('cx', d=> scaleX(d));
    durationG.select('.steps').selectAll('text')
        .data(durStepTexts).enter().append('text')
        .attr('x', d=> scaleX(d))
        .attr('y', 18)  //how far the numbers away from line
        .text(d => {return d;});
    durationG.select('.steps').append('text')
        .attr('x', sliderLength+9).attr('y', 18)
        .text('s');

    // 2. Pupil Dilation Legend
    const pupilG = d3.select('#svgPupilSlider').append('g')
        .attr('transform',`translate(${gOffset.x},${gOffset.y})`);
    const pupilCircles = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const pupilStepDots = [0, 0.25, 0.5, 0.75, 1];
    const pupilStepTexts = [0, 1];
    scaleX.domain([0, d3.max(pupilCircles)]);
    const scaleColor = colorScale.domain([0, 0.3, 1]);
    //back circles
    pupilG.selectAll('circle')
        .data(pupilCircles).enter().append('circle')
        .attr('cx', d => scaleX(d))
        .attr('r', 14)
        .style('fill', d => scaleColor(d));  //the color legend
    //lines for the slider
    pupilG.append('line').attr('x2',sliderLength);
    pupilG.insert('g').attr('class','steps')
        .selectAll('circle')
        .data(pupilStepDots).enter().append('circle')
        .attr('cx', d=> scaleX(d));
    pupilG.select('.steps').selectAll('text')
        .data(pupilStepTexts).enter().append('text')
        .attr('x', d=> scaleX(d))
        .attr('y', 25)  //how far the numbers away from line
        .text(d => {return d;});
    pupilG.select('.steps').append('text')
        .attr('x', sliderLength+15).attr('y', 25)
        .text('mm');

}


// Relocates plots back to its x,y coordinates
function relocateByXY()
{
    console.log('relocating plots by x-y coordinate.');
    
    var plotG = d3.select('#plotG');
    var plots = plotG.selectAll('circle');

    //redraw guides
    const guideG = svg.select('#guideG');
    guideG.selectAll('*').remove();    //remove all previously drawn guides
    //NOTE: this can be imported from svg file
    guideG.attr('transform','translate(5,5)');
    var len = 50;
    var xAxis = guideG.append('g').attr('transform',`translate(5, 0)`);
    xAxis.append('line').attr('x2',len);
    xAxis.append('line').attr('x2',-5).attr('y2',-3)
        .attr('transform',`translate(${len}, 0)`);
    xAxis.append('text').text('x')
        .attr('transform',`translate(${len+8}, 4)`);
    var yAxis = guideG.append('g').attr('transform',`translate(0, 5)`);
    yAxis.append('line').attr('y2',len);
    yAxis.append('line').attr('x2',-3).attr('y2',-5)
        .attr('transform',`translate(0, ${len})`);
    yAxis.append('text').text('y')
        .attr('transform',`translate(0, ${len+12})`);
    guideG.selectAll('line').classed('axis-line',true);
    guideG.selectAll('text').classed('axis-stepText',true);

    //relocate plots
    // basicOpacity = 0.8;
    plots.transition()
        .delay(function(d,i){ return 0.5*i; }) 
        .ease(d3.easeExp).duration(2000)
        .style('visibility','visible')
        // .style('opacity', basicOpacity)
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y));

}

// Relocates plots aligned in the center line by time
function relocateByTime()
{
    //NOTE: why not applied when redrawed with radio button?
    console.log('relocating plots by time.');

    const plotG = d3.select('#plotG');
    const plots = plotG.selectAll('circle');
    
    //redraw guides
    const gap = 20; //gap from the svg border
    const yOffset = svgHeight/2+50;
    const guide = { width:svgWidth-gap*2, margin:0, dotSize:2, color:'gray' };

    const steps = [];
    const oneMinuteInMS = 60000; //1minute = 60000ms
    const maxMin = timeMax/oneMinuteInMS;
    var i;
    for(i=0; i<=maxMin; i+=1){
        steps.push(i);
    }
    var largestMS = steps[steps.length-1] * oneMinuteInMS;

    var scaleX = d3.scaleLinear()
        .domain([0, timeMax])
        .range([0, guide.width]);
    var remainedX = scaleX(timeMax - largestMS);
    console.log("remainedX: "+remainedX);
    redrawXAxis('Time', 'min', steps, guide.width-remainedX, yOffset, guide.margin);
    svg.select('#guideG').attr('transform',`translate(${gap},${yOffset})`);


    //relocate plots
    // basicOpacity = 0.5;
    var scaleX = timeScale.range([gap, svgWidth-gap]);
    plots.transition()
        .delay(function(d,i){ return 0.5*i; }) 
        .ease(d3.easeElastic).duration(2000)
        .style('visibility','visible')
        // .style('opacity', basicOpacity)
        .attr('cx', d => scaleX(d.time))
        .attr('cy', d => { return svgHeight/2;});

}

// Relocates Plots with duration on x axis
function relocateByDuration()
{
    console.log('relocating plots by duration.');

    const steps = [0, 0.5, 1, 1.5, 2];
    const guide = { width:400, margin:50, dotSize:2, color:'gray' };

    var scaleX = d3.scaleLinear()
        .domain([0, d3.max(steps)])
        .range([guide.margin, guide.width - guide.margin]);

    //redraw guides
    redrawXAxis('Fixation Duration', 's', steps);

    //relocate plots
    var plotG = d3.select('#plotG');
    var plots = plotG.selectAll('circle');
    
    var scaleY = d3.scaleLinear()
        .domain([0,3000])
        .range([svgHeight-70, 50]);

    var xOffset = svgWidth/2-guide.width/2;

    //Solution3. with scaleQuantize instead of using .filter()
    var scaleQ = d3.scaleQuantize()
        .domain([-250, 2250])
        .range(steps);
    plots.transition()
        .delay(function(d,i){ return 0.5*i; }) 
        .ease(d3.easeElastic).duration(2000)
        .style('visibility','visible')
        .attr('cx', d => scaleX(scaleQ(d.duration)) + xOffset)
        .attr('cy', (d,i) => scaleY(i));
    //TODO: Solve the problem of plots not placed from the bottom
        
    //TODO: Show count for each steps?



    // //Solution1. filter() with ForEach loop
    // //this only shows the plots of first step (steps[0]) why??
    // var inclusiveVal = (steps[1]-steps[0])/2 *1000;
    // var start, end;
    // var filteredPlots;
    // steps.forEach(function(step) {
    //     step = step * 1000;
    //     start = step - inclusiveVal;
    //     end = step + inclusiveVal;
    //     console.log(`moving dots for duration ${step}s (${start} ~ ${end}ms)`);
        
    //     filteredPlots = plots.filter(function(d) {
    //         return (d.duration >= start) && (d.duration <= end);
    //     });
        
    //     filteredPlots
    //         // .transition()
    //         // .delay(function(d,i){ return 0.5*i; }) 
    //         // .ease(d3.easeExp).duration(2000)
    //         .attr('visibility','visible')
    //         .attr('cx', scaleX(step) + xOffset)
    //         .attr('cy', (d,i) => scaleY(i));
    // });


    // //Solution2. filter() with manual repetition for each steps
    // //this works exactly as desired, but ugly code..
    // plots.filter(function(d) {
    //     return (d.duration >= 0) && (d.duration <= 250);
    // })
    //     .attr('cx', scaleX(0) + xOffset)
    //     .attr('cy', (d,i) => scaleY(i));
    // plots.filter(function(d) {
    //     return (d.duration > 250) && (d.duration <= 750);
    // })
    //     .attr('cx', scaleX(0.5) + xOffset)
    //     .attr('cy', (d,i) => scaleY(i));
    // plots.filter(function(d) {
    //     return (d.duration > 750) && (d.duration <= 1250);
    // })
    //     .attr('cx', scaleX(1) + xOffset)
    //     .attr('cy', (d,i) => scaleY(i));
    // plots.filter(function(d) {
    //     return (d.duration > 1250) && (d.duration <= 1750);
    // })
    //     .attr('cx', scaleX(1.5) + xOffset)
    //     .attr('cy', (d,i) => scaleY(i));
    // plots.filter(function(d) {
    //     return (d.duration > 1750);
    // })
    //     .attr('cx', scaleX(2) + xOffset)
    //     .attr('cy', (d,i) => scaleY(i));


}

// Relocates Plots with pupil dilation on x axis
function relocateByPupilDilation()
{
    console.log('relocating plots by pupil dilation.');

    const steps = [0, 0.25, 0.5, 0.75, 1];
    const guide = { width:400, margin:50, dotSize:2, color:'gray' };

    var scaleX = d3.scaleLinear()
        .domain([0, d3.max(steps)])
        .range([guide.margin, guide.width - guide.margin]);

    //redraw guides
    redrawXAxis('Pupil Dilation', 'mm', steps);

    //relocate plots
    var plotG = d3.select('#plotG');
    var plots = plotG.selectAll('circle');
    
    var scaleY = d3.scaleLinear()
        .domain([0,3000])
        .range([svgHeight-70, 50]);

    var xOffset = svgWidth/2-guide.width/2;

    //Solution3. with scaleQuantize instead of using .filter()
    var scaleQ = d3.scaleQuantize()
        .domain([-0.125, 1.125])
        .range(steps);
    plots.transition()
        .delay(function(d,i){ return 0.5*i; }) 
        .ease(d3.easeElastic).duration(2000)
        .style('visibility','visible')
        .attr('cx', d => scaleX(scaleQ(d.avg_dilation)) + xOffset)
        .attr('cy', (d,i) => scaleY(i));
    //TODO: Solve the problem of plots not placed from the bottom
        
    //TODO: Show count for each steps?
    

}

// Helps relocateByDuration() and relocateByPupilDilation() to redraw guideG in svg
function redrawXAxis(label='label', unit='', steps, width=400, yOffset=svgHeight-55, margin=50)
{
    var scaleX = d3.scaleLinear()
        .domain([0, d3.max(steps)])
        .range([margin, width-margin]);
    
    //redraw guides
    const guideG = svg.select('#guideG');
    guideG.selectAll('*').remove();    //remove all previously drawn guides
    guideG.attr('transform',`translate(${svgWidth/2-width/2},${yOffset})`);
    //redraw guides
    guideG.append('line')
        .attr('x2', width)
        .classed('axis-line', true);
    guideG.selectAll('circle')
            .data(steps)
        .enter().append('circle')
            .attr('cx', d => scaleX(d))
            .classed('axis-stepDot', true);
    guideG.selectAll('text')
            .data(steps)
        .enter().append('text')
            .attr('x', d => scaleX(d))
            .attr('y', 20)
            .text(d => {return d;})
            .classed('axis-stepText', true);
    guideG.append('text')
        .attr('x', width/2)
        .attr('y', 40)
        .text(label+' ('+unit+')')
        .classed('axis-label', true);
}