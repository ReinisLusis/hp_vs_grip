import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ScatterChart, Scatter } from 'recharts';

// Add this near the top of the file, before the HorsepowerVsGrip function
const ROAD_CONDITIONS = {
  'Dry Asphalt (Performance)': 1.0,
  'Dry Asphalt (Normal)': 0.85,
  'Wet Asphalt': 0.6,
  'Concrete (Wet)': 0.8,
  'Gravel': 0.6,
  'Earth Road (Dry)': 0.68,
  'Earth Road (Wet)': 0.55,
  'Snow (Hard-packed)': 0.2,
  'Ice': 0.1
};

const ROLLING_RESISTANCE = {
  'Asphalt/Concrete': 0.013,
  'Rolled Gravel': 0.02,
  'Unpaved Road': 0.05,
  'Field': 0.225 // average of 0.10-0.35
};

function HorsepowerVsGrip() {
  const [carWeight, setCarWeight] = useState(1800); // kg - updated to typical EV weight
  const [selectedRoadCondition, setSelectedRoadCondition] = useState('Dry Asphalt (Performance)');
  const [selectedSurface, setSelectedSurface] = useState('Asphalt/Concrete');
  const [selectedTab, setSelectedTab] = useState('power-curve');
  
  // Constants
  const g = 9.81; // m/s^2, acceleration due to gravity
  const drivetrainEfficiency = 0.95; // 95% for EVs
  const dragCoefficient = 0.23; // improved for modern performance cars
  const frontalArea = 2.2; // m²
  const airDensity = 1.225; // kg/m³, at sea level
  const rollingResistanceCoeff = ROLLING_RESISTANCE[selectedSurface];
  
  // For launch control and advanced traction systems
  const launchBoostFactor = 1.2; // Allows momentary exceeding of static friction
  
  // Get friction coefficient from selected road condition
  const frictionCoefficient = ROAD_CONDITIONS[selectedRoadCondition];
  
  // Calculate the maximum tractive force based on weight and friction coefficient
  const maxTractiveForce = carWeight * g * frictionCoefficient * launchBoostFactor; // Newtons with launch control
  
  // Calculate the maximum power (in HP) required to break traction at different speeds
  const calculatePowerData = () => {
    const data = [];
    const speedMax = 200; // km/h
    
    for (let speed = 5; speed <= speedMax; speed += 5) {
      // Convert speed to m/s
      const speedMS = speed / 3.6;
      
      // Calculate power required to overcome traction (P = F * v)
      const powerRequired = maxTractiveForce * speedMS; // Watts
      const horsepowerRequired = powerRequired / 745.7 / drivetrainEfficiency; // Convert W to HP with drivetrain loss
      
      data.push({
        speed: speed,
        horsepowerRequired: Math.round(horsepowerRequired)
      });
    }
    
    return data;
  };

  // Calculate 0-100 km/h and 0-200 km/h times for various horsepower levels
  const calculateAccelerationTimes = () => {
    const accelData100 = [];
    const accelData200 = [];
    
    // Calculate for different horsepower levels
    for (let hp = 100; hp <= 1600; hp += 50) {
      const time100 = calculateTimeToSpeed(hp, 100);
      const time200 = calculateTimeToSpeed(hp, 200);
      
      accelData100.push({
        horsepower: hp,
        time: time100
      });
      
      accelData200.push({
        horsepower: hp,
        time: time200
      });
    }
    
    return { accelData100, accelData200 };
  };
  
  // Calculate time to reach a given speed with given horsepower
  const calculateTimeToSpeed = (horsePower, targetSpeedKMH) => {
    // Convert target speed to m/s
    const targetSpeed = targetSpeedKMH / 3.6;
    
    // Convert HP to watts
    const powerWatts = horsePower * 745.7 * drivetrainEfficiency;
    
    // Use numerical integration for more accurate time calculation
    let currentSpeed = 0.01; // Start at a small non-zero value to avoid division by zero
    let time = 0;
    const timeStep = 0.01; // smaller time step for better accuracy
    
    // Weight distribution for better launches (more weight on drive wheels)
    const effectiveWeight = carWeight * 0.5; // For calculations during initial launch
    
    // For torque curve simulation (electric motors have flat torque curve)
    const isElectric = true; // Assume electric for simplicity
    
    // AWD advantage for launches
    const awdTractionBoost = 1.3; // AWD can utilize more of the available grip
    
    while (currentSpeed < targetSpeed) {
      // Calculate current resistive forces
      // 1. Rolling resistance - approximately constant
      const rollingResistance = rollingResistanceCoeff * carWeight * g;
      
      // 2. Aerodynamic drag - increases with square of speed
      const dragForce = 0.5 * airDensity * dragCoefficient * frontalArea * (currentSpeed * currentSpeed);
      
      // 3. Total resistance
      const totalResistance = rollingResistance + dragForce;
      
      // Calculate available tractive force
      let tractiveForce;
      
      if (isElectric) {
        // Electric motors have nearly constant torque until higher RPMs
        if (currentSpeed < 15) { // m/s, about 54 km/h
          tractiveForce = powerWatts / (currentSpeed < 5 ? 5 : currentSpeed); // Constant torque region
        } else {
          tractiveForce = powerWatts / currentSpeed; // Constant power region
        }
      } else {
        // ICE engines have a power curve
        tractiveForce = powerWatts / currentSpeed;
      }
      
      // Dynamic traction limit calculation
      let dynamicTractionLimit;
      
      if (currentSpeed < 5) { // During launch (first ~18 km/h)
        // Apply AWD boost and launch control effect
        dynamicTractionLimit = effectiveWeight * g * frictionCoefficient * awdTractionBoost * launchBoostFactor;
      } else {
        dynamicTractionLimit = carWeight * g * frictionCoefficient;
      }
      
      // Limit by tire grip
      tractiveForce = Math.min(tractiveForce, dynamicTractionLimit);
      
      // Net force
      const netForce = tractiveForce - totalResistance;
      
      // Calculate acceleration (F = ma)
      const acceleration = netForce / carWeight;
      
      // If we can't accelerate anymore (or very little), break to avoid infinite loop
      if (acceleration <= 0.01) {
        return targetSpeedKMH >= 200 ? 100 : 30; // Return a high value to show it's not achievable
      }
      
      // Update speed: v = v0 + a*t
      currentSpeed += acceleration * timeStep;
      
      // Update time
      time += timeStep;
      
      // Time limit to prevent very long calculations
      if (time > 100) {
        return 100;
      }
    }
    
    return parseFloat(time.toFixed(1));
  };
  
  const powerData = calculatePowerData();
  const { accelData100, accelData200 } = calculateAccelerationTimes();
  
  // Find the point where 300 HP is no longer sufficient
  const limitPoint = powerData.find(point => point.horsepowerRequired > 300);
  const limitSpeed = limitPoint ? limitPoint.speed : 0;
  
  // Example data points for comparison (for reference markers)
  const teslaPerformanceTime = calculateTimeToSpeed(780, 100);
  const teslaPlaidTime = calculateTimeToSpeed(1020, 100);
  const highPowerEVTime = calculateTimeToSpeed(1500, 100);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-center mb-4">Car Performance Visualization</h2>
      
      {/* Tab selection */}
      <div className="flex mb-4 border-b">
        <button 
          className={`py-2 px-4 ${selectedTab === 'power-curve' ? 'bg-blue-100 border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setSelectedTab('power-curve')}
        >
          Power vs Speed
        </button>
        <button 
          className={`py-2 px-4 ${selectedTab === 'accel-100' ? 'bg-blue-100 border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setSelectedTab('accel-100')}
        >
          0-100 km/h Time
        </button>
        <button 
          className={`py-2 px-4 ${selectedTab === 'accel-200' ? 'bg-blue-100 border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setSelectedTab('accel-200')}
        >
          0-200 km/h Time
        </button>
      </div>
      
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Car Weight (kg): {carWeight}</label>
          <input 
            type="range" 
            min="1000" 
            max="2500" 
            step="50"
            value={carWeight} 
            onChange={(e) => setCarWeight(Number(e.target.value))} 
            className="w-full" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Road Condition</label>
          <select 
            value={selectedRoadCondition}
            onChange={(e) => setSelectedRoadCondition(e.target.value)}
            className="p-2 border rounded"
          >
            {Object.keys(ROAD_CONDITIONS).map(condition => (
              <option key={condition} value={condition}>
                {condition} (μ={ROAD_CONDITIONS[condition]})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Surface Type (Rolling Resistance)</label>
          <select 
            value={selectedSurface}
            onChange={(e) => setSelectedSurface(e.target.value)}
            className="p-2 border rounded"
          >
            {Object.keys(ROLLING_RESISTANCE).map(surface => (
              <option key={surface} value={surface}>
                {surface} (Cr={ROLLING_RESISTANCE[surface]})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Chart display based on selected tab */}
      <div className="mb-6">
        {selectedTab === 'power-curve' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              This graph shows how much horsepower is needed to maintain maximum acceleration (traction-limited) 
              at different speeds. Below the curve, acceleration is limited by engine power. 
              Above the curve, acceleration is limited by tire grip.
            </p>
            <LineChart width={600} height={400} data={powerData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="speed" label={{ value: 'Speed (km/h)', position: 'bottom', offset: 0 }} />
              <YAxis label={{ value: 'Horsepower Required', angle: -90, position: 'left' }} />
              <Tooltip formatter={(value) => [`${value} HP`, 'Required Power']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="horsepowerRequired" 
                stroke="#8884d8" 
                strokeWidth={2} 
                name="Required Horsepower" 
                dot={false}
              />
              <ReferenceLine y={300} stroke="red" strokeDasharray="5 5" label="300 HP Car" />
              {limitPoint && <ReferenceLine x={limitSpeed} stroke="green" strokeDasharray="5 5" label="Power-Limited Point" />}
            </LineChart>
          </>
        )}
        
        {selectedTab === 'accel-100' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              This graph shows how 0-100 km/h acceleration time decreases with more horsepower.
              Note how the curve flattens at higher power levels as tire grip becomes the limiting factor.
            </p>
            <LineChart width={600} height={400} data={accelData100} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="horsepower" label={{ value: 'Horsepower', position: 'bottom', offset: 0 }} />
              <YAxis label={{ value: '0-100 km/h Time (seconds)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(value, name) => [value + (name === 'time' ? ' seconds' : ''), name === 'time' ? 'Acceleration Time' : name]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#ff7300" 
                strokeWidth={2} 
                name="0-100 km/h Time" 
                dot 
              />
              <ReferenceLine y={2.0} stroke="green" strokeDasharray="5 5" label="2.0s (hypercar)" />
              <ReferenceLine y={10} stroke="blue" strokeDasharray="5 5" label="10s (average car)" />
              <ReferenceLine x={780} y={teslaPerformanceTime} stroke="purple" strokeDasharray="3 3" label="Tesla P100D (~780HP)" />
              <ReferenceLine x={1020} y={teslaPlaidTime} stroke="red" strokeDasharray="3 3" label="Tesla Plaid (~1020HP)" />
              <ReferenceLine x={1500} y={highPowerEVTime} stroke="black" strokeDasharray="3 3" label="1500HP EV" />
            </LineChart>
          </>
        )}
        
        {selectedTab === 'accel-200' && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              This graph shows how 0-200 km/h acceleration time varies with engine power.
              At these higher speeds, aerodynamic drag becomes a major factor limiting acceleration.
            </p>
            <LineChart width={600} height={400} data={accelData200} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="horsepower" label={{ value: 'Horsepower', position: 'bottom', offset: 0 }} />
              <YAxis label={{ value: '0-200 km/h Time (seconds)', angle: -90, position: 'left' }} />
              <Tooltip formatter={(value, name) => [value + (name === 'time' ? ' seconds' : ''), name === 'time' ? 'Acceleration Time' : name]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#82ca9d" 
                strokeWidth={2} 
                name="0-200 km/h Time" 
                dot 
              />
              <ReferenceLine y={10} stroke="green" strokeDasharray="5 5" label="10 seconds (hypercar)" />
            </LineChart>
          </>
        )}
      </div>
      
      <div className="text-sm bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Key Physics Insights:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Maximum tractive force: {Math.round(maxTractiveForce)} N</li>
          <li>Maximum possible acceleration: {(maxTractiveForce/carWeight).toFixed(2)} m/s² (about {((maxTractiveForce/carWeight)/g).toFixed(2)}g)</li>
          <li>Modeled 0-100 km/h times:</li>
          <li>Tesla Model S P100D (~780HP): {teslaPerformanceTime}s (vs. advertised 2.5s)</li>
          <li>Tesla Model S Plaid (~1020HP): {teslaPlaidTime}s (vs. advertised 2.1s)</li>
          <li>EV with 1500HP: {highPowerEVTime}s (vs. advertised 1.9s for Xiaomi SU7 Ultra)</li>
          <li>For 2.0s acceleration, a {carWeight}kg car would need ~{accelData100.find(data => data.time <= 2.0)?.horsepower || 'over 1600'}HP</li>
        </ul>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="container mx-auto p-4">
      <HorsepowerVsGrip />
    </div>
  );
}

export default App; 