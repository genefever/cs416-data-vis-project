let lineVisibility = {} // Object to keep track of line visibility status
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
  'peru',
  'brown',
  'darkcyan',
  'darkmagenta',
  'khaki',
  'sienna',
]
let xScale, yScale
const lineGenerator = (key) =>
  d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d[key]))

// Function to update tooltip content based on the selected display mode
function updateTooltipContent(datapoint, displayMode) {
  const formatDate = d3.timeFormat('%B %Y')
  const formattedDate = formatDate(datapoint.date)
  const formatDeaths = d3.format(',')

  // Build the tooltip HTML content with colored circles
  let tooltipHtml = `<strong>${formattedDate}</strong><br>`
  if (displayMode === 'show-all-data') {
    // Show all data keys in the tooltip
    dataKeys.forEach((key) => {
      const formattedValue = formatDeaths(datapoint[key])
      const lineColor = dataColors[dataKeys.indexOf(key)]
      tooltipHtml += `<svg height="10" width="10" style="vertical-align: middle;">
                      <circle cx="5" cy="5" r="5" fill="${lineColor}" />
                    </svg>
                    <span class="key">${key} </span>
                    <span class="value">${formattedValue}</span><br>`
    })
  } else if (displayMode === 'show-top-4-data') {
    // Show only the top data keys in the tooltip
    const sortedKeys = dataKeys
      .slice()
      .sort((a, b) => datapoint[b] - datapoint[a])
    const topKeys = sortedKeys.slice(0, 4) // Limit to the top 4 data keys
    topKeys.forEach((key) => {
      const formattedValue = formatDeaths(datapoint[key])
      const lineColor = dataColors[dataKeys.indexOf(key)]
      tooltipHtml += `<svg height="10" width="10" style="vertical-align: middle;">
                      <circle cx="5" cy="5" r="5" fill="${lineColor}" />
                    </svg>
                    <span class="key">${key} </span>
                    <span class="value">${formattedValue}</span><br>`
    })
  } else if (displayMode === 'show-cause-data') {
    // Show data specific to the cause (line) that the user is hovering over
    const activeLine = dataKeys.find((key) => lineVisibility[key])
    if (activeLine) {
      const formattedValue = formatDeaths(datapoint[activeLine])
      const lineColor = dataColors[dataKeys.indexOf(activeLine)]
      tooltipHtml += `<svg height="10" width="10" style="vertical-align: middle;">
                      <circle cx="5" cy="5" r="5" fill="${lineColor}" />
                    </svg>
                    <span class="key">${activeLine} </span>
                    <span class="value">${formattedValue}</span><br>`
    }
  }

  return tooltipHtml
}

// Function to set up the chart with data
function setupChart(data) {
  // Set up the SVG container
  const chartContainer = d3.select('#chart')
  const wrapper = chartContainer.append('svg') // Append instead of select
  const bounds = wrapper.append('g') // Append instead of select
  const margin = { top: 50, right: 30, bottom: 175, left: 120 } // Adjust the left margin to make space for the checkbox
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

  // Append the checkbox
  const checkbox = chartContainer.select('.checkbox')
  const checkboxLabel = chartContainer.select('.checkbox-label')

  // Position the checkbox to the top left of the y-axis
  checkbox
    .style('position', 'absolute')
    .style('top', '10px')
    .style('left', '10px')

  checkboxLabel
    .style('position', 'absolute')
    .style('top', '12px')
    .style('left', '30px')

  // Set up scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width])
  yScale = d3
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
  dataKeys.forEach((key, index) => {
    const line = lineGenerator(key)

    bounds
      .append('path')
      .datum(data)
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

  // Append x-axis label
  bounds
    .append('text')
    .attr('class', 'x-axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 120)
    .style('text-anchor', 'middle')
    .text('Time in Months')

  // Append y-axis label
  bounds
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left - 50)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Deaths')

  // Append the legend
  const legend = bounds
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${height + margin.bottom + 30})`)

  const legendItemWidth = 250 // Adjust this value based on your preference
  const legendItemsPerRow = Math.floor(width / legendItemWidth)

  const legendKeys = legend
    .selectAll('.legend-key')
    .data(dataKeys)
    .enter()
    .append('g')
    .attr('class', 'legend-key')
    .attr('transform', (d, i) => {
      const row = Math.floor(i / legendItemsPerRow)
      const col = i % legendItemsPerRow
      const xOffset = col * legendItemWidth
      const yOffset = row * 20 // Adjust this value based on your preference
      return `translate(${xOffset}, ${yOffset})`
    })

  legendKeys
    .append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d, i) => dataColors[i])

  legendKeys
    .append('text')
    .attr('x', 18) // Space between the rectangle and text
    .attr('y', 9) // Vertical alignment
    .text((d) => d)

  // Add click event listener to each legend item to toggle visibility
  legendKeys.on('click', (event, key) => {
    const line = bounds.select(`.${key}-line`)
    const circle = bounds.selectAll(`.${key}-circle`)

    // Toggle the visibility of the line and circle
    const isVisible =
      lineVisibility[key] === undefined ? false : !lineVisibility[key]
    const newOpacity = isVisible ? 1 : 0
    line.transition().duration(250).style('opacity', newOpacity)
    circle.transition().duration(250).style('opacity', newOpacity)

    // Update the line visibility status in the object
    lineVisibility[key] = isVisible

    // Update the legend item styling on click
    const legendItem = legendKeys.filter((d) => d === key)
    legendItem.classed('hidden', !isVisible)
  })

  // Calculate the total height of the legend
  const legendHeight = Math.ceil(dataKeys.length / legendItemsPerRow) * 20

  // Position the legend horizontally centered
  const legendXOffset =
    (width - Math.min(legendItemWidth * legendItemsPerRow, width)) / 2
  legend.attr(
    'transform',
    `translate(${legendXOffset}, ${height + margin.bottom - legendHeight - 30})`
  )

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
      tooltip.classed('show', true) // Add the 'show' class to display the tooltip smoothly
      bounds.selectAll('circle').style('opacity', 1) // Show all circles when mouseover occurs
      verticalLine.style('opacity', 1) // Show the vertical line when mouseover occurs
    })
    .on('mouseout', function () {
      tooltip.classed('show', false) // Remove the 'show' class to hide the tooltip smoothly
      bounds.selectAll('circle').style('opacity', 0) // Hide all circles when mouseout occurs
      verticalLine.style('opacity', 0) // Hide the vertical line when mouseout occurs
    })
    .on('mousemove', function (event) {
      const [x, y] = d3.pointer(event, this)
      const date = xScale.invert(x)
      const bisect = d3.bisector((d) => d.date).left
      const index = bisect(data, date)
      const datapoint = data[index]

      const showAllData = d3.select('#show-all-data').property('checked')
      const tooltipHtml = updateTooltipContent(datapoint, showAllData)

      tooltip
        .style('left', x + 'px')
        .style('top', y + 'px')
        .html(tooltipHtml)
        .classed('show', true)

      // Show circles for each data key when mouseover occurs
      dataKeys.forEach((key) => {
        const circle = bounds.select(`.${key}-circle`)
        const closestDataPoint = data[index]
        const closestXValue = xScale(closestDataPoint.date)
        const closestYValue = yScale(closestDataPoint[key])

        circle
          .attr('cx', closestXValue)
          .attr('cy', closestYValue)
          .style('opacity', 1)
      })

      verticalLine.attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', height) // Update vertical line position
    })
}

// Function to handle window resize
function handleResize(data) {
  bounds.select('.legend').selectAll('*').remove()

  const wrapper = d3.select('#chart').select('svg')
  const bounds = wrapper.select('g')

  const margin = { top: 20, right: 30, bottom: 60, left: 50 }
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
  xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width])
  yScale = d3
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
  dataKeys.forEach((key) => {
    const line = lineGenerator(key)
    const isVisible =
      lineVisibility[key] === undefined ? true : lineVisibility[key]

    bounds
      .selectAll(`.${key}-line`)
      .attr('d', line)
      .style('opacity', isVisible ? 1 : 0)

    bounds.selectAll(`.${key}-circle`).style('opacity', isVisible ? 1 : 0)
  })

  // Update x-axis label position
  bounds
    .select('.x-axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 30) // Adjust the y position as needed

  // Update legend position
  const legendItemsPerRow = 4
  const legendItemWidth = 100
  const legendPadding = 10
  const legendRows = Math.ceil(dataKeys.length / legendItemsPerRow)
  const legend = bounds
    .select('.legend')
    .attr('transform', `translate(0, ${height + margin.bottom + 30})`)

  // Remove existing legend items before updating
  bounds.select('.legend').selectAll('*').remove()

  const legendRow = legend
    .selectAll('.legend-row')
    .data(d3.range(legendRows))
    .enter()
    .append('g')
    .attr('class', 'legend-row')
    .attr('transform', (d, i) => `translate(0, ${i * (20 + legendPadding)})`)

  const legendItems = legendRow
    .selectAll('.legend-item')
    .data((d, i) =>
      dataKeys.slice(i * legendItemsPerRow, (i + 1) * legendItemsPerRow)
    )
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(${i * legendItemWidth}, 0)`)

  // Add colored circles to represent the lines
  legendItems
    .append('circle')
    .attr('cx', 5)
    .attr('cy', 5)
    .attr('r', 5)
    .attr('fill', (d, i) => dataColors[dataKeys.indexOf(d)])

  // Add text labels for the legend keys
  legendItems
    .append('text')
    .attr('x', 15)
    .attr('y', 10)
    .text((d) => d)
    .style('font-size', '12px')
    .attr('alignment-baseline', 'middle')
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
