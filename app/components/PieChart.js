var React = require('react');
var d3 = require("d3");

// Checks the PropType for color. Needs to be either an Array or Function to pass
function colorValidator(props, propName, componentName) {
  if (props[propName]) {
    let value = props[propName];
    if (Object.prototype.toString.call(value) === '[object Array]' || typeof value === 'function') {
      return null;
    }
    else {
      return new Error('Invalid prop `' + propName + '` supplied to' +
          ' `' + componentName + '`. Validation failed.');
    }
  }
}

/* Top level pie chart component. Checks PropTypes, provides default props if needed,
   aggregates the data into the specified categories, and passes everything on.
      data - Required. Must be an array of objects containing the data to graph.
      width - Required. Total width allotted for the graph.
      height - Required. Total height allotted for the graph.
      category - Required. Object id for the category to group on.
      color - Color scheme for the slices. Can be a D3 color scale function or an
              array of color names, hex values, or RGB values in string form.
              Defaults to a basic D3 scheme.
      innerScale - Decimal scale of the inner radius relative to the outer radius.
                   Defaults to 0.6.
      padAngle - Amount of angle in radians given for space between slices.
                 Defaults to 0.02.
      cornerRadius - Radius of curvature for the corners of slices.
                     Defaults to 7.
*/
var PieChart = React.createClass({
  propTypes:  {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    category: React.PropTypes.string.isRequired,
    color: colorValidator,
    innerScale: React.PropTypes.number,
    padAngle: React.PropTypes.number,
    cornerRadius: React.PropTypes.number,
  },
  getDefaultProps: function() {
    return {
      color: d3.scaleSequential(d3.schemeCategory10),
      innerScale: .6,
      padAngle: 0.02,
      cornerRadius: 7,
    }
  },
  render: function() {
    var props = this.props;
    var aggregatedData = d3.nest()
      .key(function(d) { return d[props.category];})
      .sortKeys(d3.ascending)
      .rollup(function(g) {
        return d3.sum(g, function(v) { return 1; });
      }).entries(props.data);
    return(
      <PieSlices data={aggregatedData} width={props.width} height={props.height} category={props.category}
        color={props.color} innerScale={props.innerScale} padAngle={props.padAngle} cornerRadius={props.cornerRadius} />
    )
  }
});

/* This component handles most of the calculations involved in creating the chart
   and slices, and then renders each piece.
*/
var PieSlices = React.createClass({
  render: function() {
    var props = this.props;
    var data = props.data;
    // The outer radius is based off of the avaliable size.
    var outerRadius = Math.min(props.width,props.height)/2.55;
    var innerRadius = outerRadius * props.innerScale;
    var center = `translate(${props.width/2}, ${props.height/2})`;

    // This creates an array containing arc angles for each category.
    var arcs = d3.pie()
      .padAngle(props.padAngle)
      .value(function(d) {return d.value})
      (props.data);

    // The arc data is merged with the original data for consistancy
    data.map(function(value, i) {
      value.arc = arcs[i];
    })

    // Determines where the legend will be placed. If there is enough room,
    // the legend will be placed inside the hole in the middle. If there is not,
    // the legend will move outside to the right. Everything is scaled accordingly.
    var totalSlices = arcs.length;
    var key = `translate(-20,-${((totalSlices-1)*20)/2})`;
    if((((totalSlices)/2)*30) >= innerRadius) {
      innerRadius *= .75;
      outerRadius *= .75;
      center = `translate(${props.width/3}, ${props.height/2})`;
      key = `translate(${(props.width/3) +15},-${((totalSlices-1)*20)/2})`;
    }

    // Handles the color options.
    // If the provided colors are an array of colors, the colors are evenly distributed
    // throughout the categories by index, and a scale is created to interpolate
    // indices between colors.
    if(Object.prototype.toString.call(props.color) === '[object Array]') {
      var colorLength = props.color.length;
      var colorDomain = [0];
      props.color.map(function(value,i) {
        if(i!=0){
          colorDomain.push((i/(colorLength-1))*props.data.length);
        }
      })
      var color = d3.scaleLinear()
        .domain(colorDomain)
        .range(props.color);
    }
    // If a color function was provided, it can stay as is.
    else {
      var color = props.color;
    }

    // Calculates the total count across all categories. Used for percentages.
    var totalCount = 0;
    data.map(function(value) {
      totalCount += value.value;
    });

    // Goes through all of the categories to create a slice component for each.
    var slices = data.map(function(value, i) {
      // Provides the appropriate means for calculating color
      if(Object.prototype.toString.call(props.color) === '[object Array]') {
        var sliceColor = color(i);
      }
      else {
        var sliceColor = color(i/totalSlices);
      }
      // Creates a slice component using all of the calculated values.
      return (
        <Slice innerRadius={innerRadius} outerRadius={outerRadius} startAngle={value.arc.startAngle}
        endAngle={value.arc.endAngle} value={value.value} key={i} renderIndex={i} arcIndex={value.arc.index} color={sliceColor}
        totalCount={totalCount} category={value.key} keyTransform={key} padAngle={props.padAngle}
        cornerRadius={props.cornerRadius} />
      )
    });
    // Renders the chart based off of the given size, then renders all of the
    // slices on the chart.
    return(
      <Chart width={props.width} height={props.height}>
        <g transform={center}>{slices}</g>
      </Chart>
    )
  }
});

// Component for creating an SVG chart given a height and width.
var Chart = React.createClass({
  render: function() {
    return(
      <svg width={this.props.width} height={this.props.height} style={{display: 'inline'}}>{this.props.children}</svg>
    );
  }
});

/* Component for rendering a single slice. Draws the slice, creates the legend
   entry, and handles the hover events.
*/
var Slice = React.createClass({
  // Hover is initially false
  getInitialState: function() {
    return{
      isHovered: false,
    }
  },
  // Sets hover to true on mouseover
  onMouseOver: function() {
    this.setState({isHovered: true});
  },
  // Sets hover to false on mouseout
  onMouseOut: function() {
    this.setState({isHovered: false});
  },
  render: function() {
    // On hover, increases the outer radius of the slice and bolds the legend entry
    var outerRadius = this.props.outerRadius;
    if(this.state.isHovered) {
      outerRadius *= 1.05;
      var style = {fontWeight: 'bold'};
    }
    else {
      var style = {fontWeight: 'normal'};
    }

    // Creates the arc for the slice.
    var arc = d3.arc()
    .startAngle(this.props.startAngle)
    .endAngle(this.props.endAngle)
    .innerRadius(this.props.innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(this.props.cornerRadius)
    .padAngle(this.props.padAngle);

    // Creates a new radius for the percentage label (which will only be used
    // if the slice is too thin for the label to be inside). Every other radius
    // is larger so that they are spaced out better.
    if(this.props.arcIndex % 2 == 0) {
      var labelRadius = outerRadius + 15;
    }
    else {
      var labelRadius = outerRadius + 50;
    }

    // Creates the arc for the outside percentage labels. Essentially just extends
    // the first arc a little farther.
    var arc2 =d3.arc()
    .startAngle(this.props.startAngle)
    .endAngle(this.props.endAngle)
    .innerRadius(outerRadius)
    .outerRadius(labelRadius)
    .cornerRadius(this.props.cornerRadius)
    .padAngle(this.props.padAngle);

  // Calculates the percentage of the category.
  var percentage = Math.round(((this.props.value) / (this.props.totalCount))*100);
  var text = percentage + "%";
  // Calculates the centers of the arcs.
  var center1 = arc.centroid();
  var center2 = arc2.centroid();
  // Creates the line used if the labels needs to be outside the arc.
  var path = "m "+center1[0] +" "+ center1[1]+" L "+center2[0] +" "+ center2[1];

    // Renders the slice, label, and legend entry. Sets up hover functions.
    // If the slice is less than 3%, it is placed outside and given a line.
    return(
      <g onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}>
        <path fill={this.props.color} d={arc()} />
        {percentage >= 3 ? null : <path d={path} stroke={this.props.color} />}

        {percentage >= 3 ? <text transform={`translate(${arc.centroid()})`}
          textAnchor="middle" fill={"white"}> {text}</text>
          :
          <text transform={`translate(${arc2.centroid()})`}
            textAnchor="middle" fill={this.props.color}> {text}</text>}

          <g transform={this.props.keyTransform}>
            <g transform={`translate(0,${this.props.renderIndex*20})`}>
              <circle transform={`translate(-10,-5)`} r={7} fill={this.props.color} />
              <text fill={this.props.color} style={style}>{this.props.category} </text>
            </g>
          </g>
      </g>
    )
  }
});



module.exports = PieChart;
