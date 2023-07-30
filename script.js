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
let lineVisibility = {}
let data,
  xScale,
  yScale,
  margin,
  width,
  height,
  activeDatapoint,
  verticalLine,
  activeLine,
  lastLineClicked = null,
  bounds = null

const lineGenerator = (key) =>
  d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d[key]))

// Function to update the circles based on active line and visibility status
function updateCircles() {
  dataKeys.forEach((key) => {
    const isVisible = lineVisibility[key]
    const circle = bounds.selectAll(`.${key}-circle`)

    circle.style('opacity', (d) => {
      if (activeLine) {
        return key === activeLine && isVisible ? 1 : 0
      } else {
        return isVisible ? 1 : 0
      }
    })
  })
}

// Function to update tooltip content based on the selected display mode
function updateTooltipContent(datapoint, displayMode, activeLine) {
  const formatDate = d3.timeFormat('%B %Y')
  const formattedDate = formatDate(datapoint.date)
  const formatDeaths = d3.format(',')

  // Build the tooltip HTML content with colored circles
  let tooltipHtml = `<strong>${formattedDate}</strong><br>`

  // Always show Total Deaths to the tooltip with a separator below it
  const allDeathsValue = formatDeaths(datapoint['all_deaths'])
  tooltipHtml += `
    <div class="all-deaths">
      <strong>
        <span class="label">Total Deaths</span>
        <span class="value">${allDeathsValue}</span>
      </strong>
    </div>
    <hr/>
  `

  // Sort the dataKeys array by the corresponding data values
  const sortedKeys = dataKeys
    .slice()
    .sort((a, b) => (a === 'all_deaths' ? -1 : datapoint[b] - datapoint[a]))

  // Show data for the active line only
  if (activeLine) {
    const formattedValue = formatDeaths(datapoint[activeLine])
    const lineColor = dataColors[dataKeys.indexOf(activeLine)]
    tooltipHtml += `
      <svg height="10" width="10" style="vertical-align: middle;">
        <circle cx="5" cy="5" r="5" fill="${lineColor}" />
      </svg>
      <span class="key">${activeLine} </span>
      <span class="value">${formattedValue}</span><br>
    `
  } else {
    if (displayMode === 'show-top-4-data') {
      // Limit to the top 3 data keys and exclude 'all_deaths' from the sorted keys
      const topKeys = sortedKeys
        .slice(0, 4)
        .filter((key) => key !== 'all_deaths')

      topKeys.forEach((activeLine) => {
        const formattedValue = formatDeaths(datapoint[activeLine])
        const lineColor = dataColors[dataKeys.indexOf(activeLine)]
        tooltipHtml += `
        <svg height="10" width="10" style="vertical-align: middle;">
          <circle cx="5" cy="5" r="5" fill="${lineColor}" />
        </svg>
        <span class="key">${activeLine} </span>
        <span class="value">${formattedValue}</span><br>
      `
      })
    } else {
      // Show all data keys except 'all_deaths' in the tooltip using sortedKeys
      sortedKeys.forEach((key) => {
        if (key !== 'all_deaths') {
          const formattedValue = formatDeaths(datapoint[key])
          const lineColor = dataColors[dataKeys.indexOf(key)]
          tooltipHtml += `
          <svg height="10" width="10" style="vertical-align: middle;">
            <circle cx="5" cy="5" r="5" fill="${lineColor}" />
          </svg>
          <span class="key">${key} </span>
          <span class="value">${formattedValue}</span><br>
        `
        }
      })
    }
  }

  return tooltipHtml
}

function toggleLineAndLegend(x, y, event, key, data) {
  let isVisible = lineVisibility[key]
  let newOpacity

  // Toggle the visibility of all lines and circles
  dataKeys.forEach((dataKey) => {
    const line = bounds.select(`.${dataKey}-line`)
    const circle = bounds.selectAll(`.${dataKey}-circle`)

    // Determine the new opacity for the current data key
    if (lastLineClicked === null) {
      if (dataKey === key) {
        newOpacity = 1
        lineVisibility[dataKey] = true
      } else {
        newOpacity = 0.1
        lineVisibility[dataKey] = false
      }
    } else {
      if (lastLineClicked === key) {
        if (isVisible && dataKey !== key) {
          newOpacity = lineVisibility[dataKey] ? 0.1 : 1
          lineVisibility[dataKey] = !lineVisibility[dataKey]
        }
      } else {
        if (dataKey === key) {
          newOpacity = 1
          lineVisibility[dataKey] = true
        } else {
          newOpacity = 0.1
          lineVisibility[dataKey] = false
        }
      }
    }

    // Apply the new opacity to the line and circle elements
    line.transition().duration(250).style('opacity', newOpacity)
    circle.transition().duration(250).style('opacity', newOpacity)
  })

  // Update the legend items' opacity after determining the final newOpacity value
  dataKeys.forEach((dataKey) => {
    const legendItem = bounds.select(`.${dataKey}-legend-item`)
    legendItem.style('opacity', lineVisibility[dataKey] ? 1 : 0.1)
  })

  // Update the active line based on whether it is toggled or de-selected
  activeLine = lastLineClicked && isVisible ? null : key
  lastLineClicked = activeLine

  // Update tooltip content based on the selected line
  const displayMode = d3
    .select('input[name="tooltip-option"]:checked')
    .node().value
  const tooltipHtml = updateTooltipContent(
    activeDatapoint,
    displayMode,
    activeLine
  )
  const tooltip = d3.select('#tooltip')
  tooltip
    .style('left', x + 'px')
    .style('top', y + 'px')
    .html(tooltipHtml)
    .classed('show', true)

  // Update the tooltip content when toggling a line
  handleMousemove(event, data)
}

function toggleTooltipOption(option) {
  const displayMode = d3
    .select('input[name="tooltip-option"]:checked')
    .node().value
  if (option === displayMode) return // No need to update if already selected

  d3.select(`#${displayMode}`).property('checked', false)
  d3.select(`#${option}`).property('checked', true)

  // Update the tooltip content when toggling the option
  const tooltipHtml = updateTooltipContent(activeDatapoint, option, activeLine)
  const tooltip = d3.select('#tooltip')
  tooltip.html(tooltipHtml)
}

function toggleYAxisScale(scaleType) {
  if (scaleType === 'linear') {
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
  } else if (scaleType === 'log-base-2') {
    yScale = d3
      .scaleLog()
      .base(2)
      .domain([
        1,
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
  }

  // Update the y-axis
  bounds.select('.y-axis').call(d3.axisLeft(yScale))

  // Update the lines on y-axis scale change
  dataKeys.forEach((key) => {
    const line = lineGenerator(key)
    const isVisible = lineVisibility[key]

    bounds
      .selectAll(`.${key}-line`)
      .attr('d', line)
      .style('opacity', isVisible ? 1 : 0)
      .on('mouseover', () => {
        activeLine = key
      })
      .on('mouseout', () => {
        activeLine = null
      })
      .on('mousemove', (event) => {
        handleMousemove(event, data)
      })

    // Hide the circles temporarily during y-axis scale change
    bounds.selectAll(`.${key}-circle`).style('opacity', 0)
  })

  // Update tooltip content and circles based on the active line and y-axis scale
  const displayMode = d3
    .select('input[name="tooltip-option"]:checked')
    .node().value
  const tooltipHtml = updateTooltipContent(
    activeDatapoint,
    displayMode,
    activeLine
  )
  const tooltip = d3.select('#tooltip')
  tooltip.html(tooltipHtml)

  updateCircles()
}

// Function to set up the chart with data
function setupChart(data) {
  // Set up the SVG container
  const chartContainer = d3.select('#chart')
  const wrapper = chartContainer.append('svg')
  bounds = wrapper.append('g')
  margin = { top: 50, right: 30, bottom: 175, left: 150 }
  width = window.innerWidth - margin.left - margin.right
  height = window.innerHeight - margin.top - margin.bottom

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

  // Append the radio buttons inside the chart container
  const radioContainer = chartContainer
    .append('div')
    .attr('class', 'radio-container')

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
      .on('mouseover', () => {
        // Set the activeLine when the user hovers over a line
        activeLine = key
      })
      .on('mouseout', () => {
        // Reset the activeLine when the user stops hovering over a line
        activeLine = null
      })
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
    .attr('y', 0 - margin.left + 50)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Number of Deaths')
    .classed('y-axis-label', true)

  // Append the legend
  const legend = bounds
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${height + margin.bottom + 30})`)

  legend
    .append('g')
    .attr('class', 'legend-title')
    .append('text')
    .attr('x', (width - margin.left - margin.right) / 4 - 90)
    .attr('y', -8) // Adjust the vertical position of the title
    .style('text-anchor', 'middle')
    .text('Cause of Death (Click on a legend to view its detail)')

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
    .attr('class', (d) => `${d}-legend-item`)

  legendKeys
    .append('text')
    .attr('x', 18) // Space between the rectangle and text
    .attr('y', 9) // Vertical alignment
    .text((d) => d)

  // Initialize the visibility status of each line to true
  dataKeys.forEach((key) => {
    lineVisibility[key] = true
  })

  // Add click event listener to each legend item to toggle visibility
  legendKeys.on('click', (event, key) => {
    const [x, y] = d3.pointer(event, bounds.select('.overlay').node())
    toggleLineAndLegend(x, y, event, key, data)
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
  verticalLine = bounds
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
}

// Function to handle mousemove event
function handleMousemove(event, data) {
  // Hide all circles when mousemove occurs
  bounds.selectAll('circle').style('opacity', 0)

  const [x, y] = d3.pointer(event, bounds.select('.overlay').node())
  const date = xScale.invert(x)
  const bisect = d3.bisector((d) => d.date).left
  const index = bisect(data, date)
  const closestDataPoint = data[index]
  const margin = { top: 50, right: 30, bottom: 175, left: 120 }
  const height = window.innerHeight - margin.top - margin.bottom
  activeDatapoint = data[index]

  const displayMode = d3
    .select('input[name="tooltip-option"]:checked')
    .node().value
  const tooltipHtml = updateTooltipContent(
    activeDatapoint,
    displayMode,
    activeLine
  )
  const tooltip = d3.select('#tooltip')
  tooltip
    .style('left', x + 'px')
    .style('top', y + 'px')
    .html(tooltipHtml)
    .classed('show', true)

  // Show circles for each data key when mouseover occurs
  dataKeys.forEach((key) => {
    if (lineVisibility[key]) {
      const circle = bounds.select(`.${key}-circle`)
      const closestXValue = xScale(closestDataPoint.date)
      const closestYValue = yScale(closestDataPoint[key])

      circle
        .attr('cx', closestXValue)
        .attr('cy', closestYValue)
        .style('opacity', 1)
    } else {
      bounds.select(`.${key}-circle`).style('opacity', 0)
    }
  })

  // Update the activeDatapoint based on the closest data point
  activeDatapoint = closestDataPoint

  // Update the circles based on the active line and visibility status
  updateCircles()

  verticalLine.attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', height) // Update vertical line position
}

// Function to handle window resize
function handleResize(data, event) {
  // Get the updated width and height after window resize
  const width = window.innerWidth - margin.left - margin.right
  const height = window.innerHeight - margin.top - margin.bottom

  // Update the SVG wrapper size and bounds transform
  const wrapper = d3.select('#chart').select('svg')
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

  // Update the scales with the new data range
  xScale.range([0, width])
  yScale.range([height, 0])

  // Update the x-axis and y-axis
  bounds
    .select('.x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
  bounds.select('.y-axis').call(d3.axisLeft(yScale))

  // Update the lines on resize
  dataKeys.forEach((key) => {
    const line = lineGenerator(key)
    const isVisible = lineVisibility[key]

    bounds
      .selectAll(`.${key}-line`)
      .attr('d', line)
      .style('opacity', isVisible ? 1 : 0)
      .on('mouseover', () => {
        activeLine = key
      })
      .on('mouseout', () => {
        activeLine = null
      })
      .on('mousemove', (event) => {
        handleMousemove(event, data)
      })

    // Hide the circles temporarily during window resize
    bounds.selectAll(`.${key}-circle`).style('opacity', 0)
  })

  // Update x-axis label position
  bounds
    .select('.x-axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 120)
    .style('text-anchor', 'middle')

  // Update y-axis label position
  bounds
    .select('.y-axis-label')
    .attr('y', -margin.left + 50)
    .attr('x', 0 - height / 2)
    .style('text-anchor', 'middle')

  // Update legend position and items per row based on new width
  const legendItemWidth = 150 // Adjust this value based on your preference
  const legendPadding = 10 // Adjust this value based on your preference
  const legendItemsPerRow = Math.floor(
    width / (legendItemWidth + legendPadding)
  )
  const legendRows = Math.ceil(dataKeys.length / legendItemsPerRow)
  const legendXOffset =
    (width - Math.min(legendItemWidth * legendItemsPerRow, width)) / 2
  const legendYOffset = height + margin.bottom - legendRows * 20 - 30

  const legend = bounds.select('.legend')
  legend.attr('transform', `translate(${legendXOffset}, ${legendYOffset})`)

  // Update legend items' position
  const legendKeys = legend.selectAll('.legend-key')
  legendKeys.attr('transform', (d, i) => {
    const row = Math.floor(i / legendItemsPerRow)
    const col = i % legendItemsPerRow
    const xOffset = col * (legendItemWidth + legendPadding)
    const yOffset = row * 20 // Adjust this value based on your preference
    return `translate(${xOffset}, ${yOffset})`
  })

  // Hide the vertical line during window resize
  verticalLine.style('opacity', 0)

  // Remove the 'show' class from the tooltip to hide it during window resize
  const tooltip = d3.select('#tooltip')
  tooltip.classed('show', false)

  // Clear the active line and activeDatapoint during window resize
  activeLine = null
  activeDatapoint = null
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
    .then((loadedData) => {
      data = loadedData
      // Initial setup of the chart
      setupChart(data)

      // Add event listener for radio buttons to update tooltip display mode
      const radioButtons = document.querySelectorAll(
        'input[name="tooltip-option"]'
      )
      radioButtons.forEach((radioButton) => {
        radioButton.addEventListener('change', (event) => {
          handleMousemove(event, data)
        })
      })

      // Add mousemove event listener to update tooltip content when mouse moves
      bounds.select('.overlay').on('mousemove', (event) => {
        handleMousemove(event, data)
      })

      // Add window resize event listener
      window.addEventListener('resize', (event) => handleResize(data, event))

      // Call toggleYAxisScale initially with the default y-axis scale (linear)
      toggleYAxisScale('linear')
    })
    .catch((error) => {
      console.error('Error loading CSV data:', error)
    })
}

main()
