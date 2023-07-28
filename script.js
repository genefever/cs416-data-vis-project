const parseDate = d3.timeParse('%m/%d/%Y')
const dataKeys = [
  'all_deaths',
  'natural_deaths',
  'covid_19_multiple',
  'covid_19_underlying',
  'drug_overdose',
  'homicide',
  'suicide',
  'vehicle_accidents',
  'unintentional_injuries',
  'heart_diseases',
  'cerebrovascular_diseases',
  'alzheimers',
  'diabetes',
  'influenza_pneumonia',
]
const dataColors = [
  'red',
  'green',
  'blue',
  'orange',
  'purple',
  'gray',
  'black',
  'olive',
  'stateblue',
  'goldenroad',
  'darkcyan',
  'darkmagenta',
  '"khaki"',
  'sienna',
]

// Function to set up the chart with data
function setupChart(data) {
  // Set up the SVG container
  const wrapper = d3.select('#chart').append('svg') // Append instead of select
  const bounds = wrapper.append('g') // Append instead of select
  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  const width = window.innerWidth - margin.left - margin.right
  const height = window.innerHeight - margin.top - margin.bottom

  wrapper
    .attr('width', '100%')
    .attr('height', '100%')
    .attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )

  bounds.attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Set up scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width])
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        d3.max([
          d.all_deaths,
          d.natural_deaths,
          d.covid_19_multiple,
          d.covid_19_underlying,
          d.drug_overdose,
          d.homicide,
          d.suicide,
          d.vehicle_accidents,
          d.unintentional_injuries,
          d.heart_diseases,
          d.cerebrovascular_diseases,
          d.alzheimers,
          d.diabetes,
          d.influenza_pneumonia,
        ])
      ),
    ])
    .range([height, 0])

  // Append the lines dynamically based on data keys
  const lineGenerator = (key, strokeColor) =>
    d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[key]))

  dataKeys.forEach((key, index) => {
    const line = lineGenerator(key)

    bounds
      .selectAll(`.${key}-line`)
      .data([data])
      .join('path')
      .attr('class', `${key}-line line`)
      .attr('fill', 'none')
      .attr('stroke', dataColors[index])
      .attr('d', line)
  })

  // Append x-axis
  bounds
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))

  // Append y-axis
  bounds.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale))

  // Append y-axis label
  bounds
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left - 50)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Deaths')

  // Append circles for each data key when mouseover occurs
  dataKeys.forEach((key, index) => {
    bounds
      .selectAll(`.${key}-circle`)
      .data(data)
      .enter()
      .append('circle')
      .attr('class', `${key}-circle`)
      .attr('r', 4)
      .attr('fill', dataColors[index])
      .style('opacity', 0) // Initially hide the circles
  })

  // Add vertical line
  const verticalLine = bounds
    .append('line')
    .attr('class', 'vertical-line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', height)
    .style('stroke', 'black')
    .style('stroke-width', '1px')
    .style('opacity', 0) // Initially hide the vertical line

  // Add tooltip functionality
  const tooltip = d3.select('#tooltip')

  bounds
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .style('opacity', 0) // Initially hide the overlay
    .on('mouseover', function () {
      tooltip.style('opacity', 1) // Show the tooltip when mouseover occurs
      circle.style('opacity', 1) // Show the circle when mouseover occurs
      verticalLine.style('opacity', 1) // Show the vertical line when mouseover occurs
    })
    .on('mouseout', function () {
      tooltip.style('opacity', 0) // Hide the tooltip when mouseout occurs
      circle.style('opacity', 0) // Hide the circle when mouseout occurs
      verticalLine.style('opacity', 0) // Hide the vertical line when mouseout occurs
    })

    .on('mousemove', function (event) {
      const [x, y] = d3.pointer(event, this)
      const date = xScale.invert(x)
      const bisect = d3.bisector((d) => d.date).left
      const index = bisect(data, date)
      const datapoint = data[index]

      const formatDate = d3.timeFormat('%B %Y')
      const formattedDate = formatDate(datapoint.date)

      const formatDeaths = d3.format(',')

      // Build the tooltip HTML content with colored circles
      let tooltipHtml = `<strong>${formattedDate}</strong><br>`
      dataKeys.forEach((key, dataIndex) => {
        // Use a different variable for the loop
        const formattedValue = formatDeaths(datapoint[key])
        const lineColor = dataColors[dataIndex]
        tooltipHtml += `<svg height="10" width="10" style="vertical-align: middle;">
                      <circle cx="5" cy="5" r="5" fill="${lineColor}" />
                    </svg>
                    <span class="key">${key}:</span>
                    <span class="value">${formattedValue}</span><br>`
      })

      tooltip
        .style('left', x + 'px')
        .style('top', y + 'px')
        .style('opacity', 1) // Show the tooltip when mouseover occurs
        .html(tooltipHtml)

      // Show circles for each data key when mouseover occurs
      dataKeys.forEach((key, dataIndex) => {
        const circle = bounds.select(`.${key}-circle`)

        const closestDataPoint = data[index]
        const closestXValue = xScale(closestDataPoint.date)
        const closestYValue = yScale(closestDataPoint[key])

        circle
          .attr('cx', closestXValue)
          .attr('cy', closestYValue)
          .style('opacity', 1)
      })

      verticalLine
        .attr('x1', closestXValue)
        .attr('x2', closestXValue)
        .attr('y1', closestYValue)
        .attr('y2', height) // Update vertical line position
    })
}

// Function to handle window resize
function handleResize(data) {
  const wrapper = d3.select('#chart').select('svg')
  const bounds = wrapper.select('g')

  const margin = { top: 20, right: 30, bottom: 30, left: 50 }
  const width = window.innerWidth - margin.left - margin.right
  const height = window.innerHeight - margin.top - margin.bottom

  wrapper
    .attr('width', '100%')
    .attr('height', '100%')
    .attr(
      'viewBox',
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )

  bounds.attr('transform', `translate(${margin.left}, ${margin.top})`)

  // Update scales with new data range
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width])
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        d3.max([
          d.all_deaths,
          d.natural_deaths,
          d.covid_19_multiple,
          d.covid_19_underlying,
          d.drug_overdose,
          d.homicide,
          d.suicide,
          d.vehicle_accidents,
          d.unintentional_injuries,
          d.heart_diseases,
          d.cerebrovascular_diseases,
          d.alzheimers,
          d.diabetes,
          d.influenza_pneumonia,
        ])
      ),
    ])
    .range([height, 0])

  bounds
    .select('.x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
  bounds.select('.y-axis').call(d3.axisLeft(yScale))

  // Update the lines on resize
  const lineGenerator = (key) =>
    d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[key]))

  dataKeys.forEach((key, index) => {
    const line = lineGenerator(key)

    bounds.selectAll(`.${key}-line`).attr('d', line)
  })
}

// Function to parse and process data
function processData(csvData) {
  const data = csvData.map((d) => ({
    date: parseDate(d['End Date']),
    all_deaths: +d['All Cause'],
    natural_deaths: +d['Natural Cause'],
    covid_19_multiple: +d['COVID-19 (Multiple Cause of Death)'],
    covid_19_underlying: +d['COVID-19 (Underlying Cause of Death)'],
    drug_overdose: +d['Drug Overdose'],
    homicide: +d['Assault (Homicide)'],
    suicide: +d['Intentional Self-Harm (Suicide)'],
    vehicle_accidents: +d['Motor Vehicle Accidents'],
    unintentional_injuries: +d['Accidents (Unintentional Injuries)'],
    heart_diseases: +d['Diseases of Heart'],
    cerebrovascular_diseases: +d['Cerebrovascular Diseases'],
    alzheimers: +d['Alzheimer Disease'],
    diabetes: +d['Diabetes Mellitus'],
    influenza_pneumonia: +d['Influenza and Pneumonia'],
    // new_data_column: +d['New Data Column'], // Add new data columns here
  }))

  if (data.length === 0) {
    console.error('Empty data array')
    return []
  }

  return data
}

// Main function
function main() {
  d3.csv('data_deaths_2020_2023.csv')
    .then(processData)
    .then((data) => {
      setupChart(data)
      window.addEventListener('resize', () => handleResize(data))
    })
    .catch((error) => {
      console.error('Error loading CSV data:', error)
    })
}

main()
