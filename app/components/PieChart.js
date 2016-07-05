var React = require('react');
var d3 = require("d3");

var PieChart = React.createClass({
  propTypes:  {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    category: React.PropTypes.string.isRequired,
    color: React.PropTypes.func,
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
      }).entries(this.props.data);
    return(
      <PieSlices data={aggregatedData} width={props.width} height={props.height} category={props.category}
        color={props.color} innerScale={props.innerScale} padAngle={props.padAngle} cornerRadius={props.cornerRadius} />
    )
  }
});

var PieSlices = React.createClass({
  onClick: function() {
    this.setState({innerRadius: this.state.innerRadius-10});
  },
  render: function() {
    var props = this.props;
    var outerRadius = Math.min(props.width,props.height)/2.55;
    var innerRadius = outerRadius * props.innerScale;
    var center = `translate(${props.width/2}, ${props.height/2})`;

    var arcs = d3.pie()
      .padAngle(props.padAngle)
      .value(function(d) {return d.value})
      (props.data);

    var totalSlices = arcs.length;
    var key = `translate(-20,-${((totalSlices-1)*20)/2})`;
    if((((totalSlices)/2)*30) >= innerRadius) {
      innerRadius *= .75;
      outerRadius *= .75;
      center = `translate(${props.width/3}, ${props.height/2})`;
      key = `translate(${(props.width/3) +15},-${((totalSlices-1)*20)/2})`;
    }

    var total = 0;
    props.data.map(function(value) {
      total += value.value;
    });
    var slices = arcs.map(function(arc, i) {
      return (
        <Slice innerRadius={innerRadius} outerRadius={outerRadius} startAngle={arc.startAngle}
        endAngle={arc.endAngle} value={arc.value} key={i} index={i} color={props.color(i/totalSlices)}
        total={total} category={props.data[i].key} keyTransform={key} padAngle={props.padAngle}
        cornerRadius={props.cornerRadius} />
      )
    });
    return(
      <Chart width={props.width} height={props.height}>
        <g transform={center}>{slices}</g>
      </Chart>
    )
  }
});

var Chart = React.createClass({
  render: function() {
    return(
      <svg width={this.props.width} height={this.props.height} style={{display: 'inline'}}>{this.props.children}</svg>
    );
  }
});

var Slice = React.createClass({
  getInitialState: function() {
    return{
      isHovered: false,
    }
  },
  onMouseOver: function() {
    this.setState({isHovered: true});
  },
  onMouseOut: function() {
    this.setState({isHovered: false});
  },
  render: function() {
    var outerRadius = this.props.outerRadius;
    if(this.state.isHovered) {
      outerRadius *= 1.05;
      var style = {fontWeight: 'bold'};
    }
    else {
      var style = {fontWeight: 'normal'};
    }
    var arc = d3.arc()
    .startAngle(this.props.startAngle)
    .endAngle(this.props.endAngle)
    .innerRadius(this.props.innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(this.props.cornerRadius)
    .padAngle(this.props.padAngle);

    if(this.props.index % 2 == 0) {
      var labelRadius = outerRadius + 15;
    }
    else {
      var labelRadius = outerRadius + 50;
    }
    var arc2 =d3.arc()
    .startAngle(this.props.startAngle)
    .endAngle(this.props.endAngle)
    .innerRadius(outerRadius)
    .outerRadius(labelRadius)
    .cornerRadius(this.props.cornerRadius)
    .padAngle(this.props.padAngle);


  var percentage = Math.round(((this.props.value) / (this.props.total))*100);
  //var text = this.props.value + "-"+ percentage + "%";
  var text = percentage + "%";
  var center1 = arc.centroid();
  var center2 = arc2.centroid();
  var path = "m "+center1[0] +" "+ center1[1]+" L "+center2[0] +" "+ center2[1];
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
            <g transform={`translate(0,${this.props.index*20})`}>
              <circle transform={`translate(-10,-5)`} r={7} fill={this.props.color} />
              <text fill={this.props.color} style={style}>{this.props.category} </text>
            </g>
          </g>
      </g>
    )
  }
});



module.exports = PieChart;
