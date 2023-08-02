'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent;

/************* Parent Class ******************/

class Workout {
  //
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration, distacne) {
    this.coords = coords; // [lat, lng]
    this.duration = duration;
    this.distacne = distacne;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()} `;
    return this.description;
  }
}

/*****************Child class **************** */

class Running extends Workout {
  //
  type = 'running';
  constructor(coords, duration, distacne, cadence) {
    super(coords, duration, distacne);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distacne;
    return this.pace;
  }
}

/*****************Child class **************** */

class Cycling extends Workout {
  //
  type = 'cycling';
  constructor(coords, duration, distacne, elevationGin) {
    super(coords, duration, distacne);
    this.elevationGin = elevationGin;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distacne / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([17, -39], 90, 125, 200);
const cycling1 = new Cycling([12, -59], 120, 17, 550);

////////////////////////////////////////////////////////////////
//                 Application archtecture                   //
////////////// ////////////////////////////////// ////////////
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //Get current location of the user
    this._getPosition();

    //Get the local storage
    this._getLocalSotrage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._getMapPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert(`Coudn't fetch the location😢`)
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const myLocation = `https://www.google.com/maps/@${latitude},${longitude}`;
    let coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //show markers on map after fetching datat form local storage
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const allPositives = (...inputs) => inputs.every(input => input > 0);

    const type = inputType.value;
    const distacne = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //Check if the type is running
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distacne, duration, cadence) ||
        !allPositives(distacne, duration, cadence)
      )
        return alert('Input can only positive');

      workout = new Running([lat, lng], distacne, duration, cadence);
    }

    //Check if the type is cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distacne, duration, elevation) ||
        !allPositives(distacne, duration)
      )
        return alert('Input can only positive');
      workout = new Cycling([lat, lng], distacne, duration, elevation);
    }

    //Storing the workouts into workouts array
    this.#workouts.push(workout);

    //Render workout marker on the map
    this._renderWorkoutMarker(workout);

    //Render workout
    this._renderWorkout(workout);

    this._hideForm();

    //Store the workouts in the local sotrage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const coords = workout.coords;
    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description} </h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distacne}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>

    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">178</span>
      <span class="workout__unit">${workout.cadence}</span>
    </div>
  </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _getMapPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animation: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalSotrage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      setTimeout(() => this._renderWorkoutMarker(work), 3000);
    });
  }

  resetLocalStorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
