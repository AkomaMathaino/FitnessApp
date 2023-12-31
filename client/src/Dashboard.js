import React, { useState, useEffect } from "react";
import RoutineFormModal from "./RoutineFormModal";
import WeightFormModal from "./WeightFormModal";
import DeleteRoutineModal from "./DeleteRoutineModal";
import UpdateRoutineModal from "./UpdateRoutineModal";
import ExerciseFormModal from "./ExerciseFormModal";
import UpdateExerciseModal from "./UpdateExerciseModal";
import DeleteExerciseModal from "./DeleteExerciseModal";
import DeleteTrackedExerciseModal from "./DeleteTrackedExerciseModal";
import NotesModal from "./NotesModal";
import * as d3 from "d3";
import moment from "moment";
import InstructionsModal from "./InstructionsModal";
import StatisticsModal from "./StatisticsModal";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Axios from "axios";

const Dashboard = (props) => {
  const {
    loginStatus,
    userProfile,
    previousWeight,
    setPreviousWeight,
    formattedDate,
    routines,
    setRoutines,
    exercises,
    trackedExercises,
    setTrackedExercises,
    weightData,
    setWeightData,
    setUserProfile,
    convertWeight,
    defaultConvertWeight,
    safeParseFloat,
    openMenus,
    setOpenMenus,
    routineExercises,
    setRoutineExercises,
    apiURL,
  } = props;
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showUpdateRoutineModal, setShowUpdateRoutineModal] = useState(false);
  const [showDeleteRoutineModal, setShowDeleteRoutineModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showUpdateExerciseModal, setShowUpdateExerciseModal] = useState(false);
  const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false);
  const [showDeleteTrackedExerciseModal, setShowDeleteTrackedExerciseModal] =
    useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState({});
  const [firstExercise, setFirstExercise] = useState({});
  const [weightTimeBtN, setWeightTimeBtN] = useState(0);
  const [tickMultiplier, setTickMultiplier] = useState(6);
  const [timeSelection, setTimeSelection] = useState("1 month");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      localStorage.clear();
      navigate("/login");
    }
  });

  const toggleModal = (modalName, isOpen) => {
    switch (modalName) {
      case "weight":
        setShowWeightModal(isOpen);
        break;
      case "routine":
        setShowRoutineModal(isOpen);
        break;
      case "updateRoutine":
        setShowUpdateRoutineModal(isOpen);
        break;
      case "deleteRoutine":
        setShowDeleteRoutineModal(isOpen);
        break;
      case "exercise":
        setShowExerciseModal(isOpen);
        break;
      case "notes":
        setShowNotesModal(isOpen);
        break;
      case "updateExercise":
        setShowUpdateExerciseModal(isOpen);
        break;
      case "deleteExercise":
        setShowDeleteExerciseModal(isOpen);
        break;
      case "deleteTrackedExercise":
        setShowDeleteTrackedExerciseModal(isOpen);
        break;
      case "instructions":
        setShowInstructionsModal(isOpen);
        break;
      case "exerciseStatistics":
        setShowStatisticsModal(isOpen);
        break;
      default:
        break;
    }
  };

  const getExercisesForRoutine = (routineId) => {
    if (exercises.length > 0) {
      return exercises.filter((exercise) => exercise.routine_id === routineId);
    } else {
      return;
    }
  };

  const toggleMenu = (routineId) => {
    setOpenMenus((prevOpenMenus) => ({
      ...prevOpenMenus,
      [routineId]: !prevOpenMenus[routineId],
    }));

    if (!routineExercises[routineId]) {
      const exercisesForRoutine = getExercisesForRoutine(routineId);
      setRoutineExercises((prevRoutineExercises) => ({
        ...prevRoutineExercises,
        [routineId]: exercisesForRoutine,
      }));
    }
  };

  const toggleTrackedMenu = (exerciseName) => {
    setOpenMenus((prevState) => ({
      ...prevState,
      [exerciseName]: !prevState[exerciseName],
    }));
  };

  const compareBW = (bw, weight) => {
    return Number(weight / bw).toFixed(2);
  };

  useEffect(() => {
    d3.select(".weightGraph svg").remove();

    if (weightData.length > 0) {
      const weightValues = weightData
        .filter((d) => d.weight != null)
        .map((d) => d.weight);
      const dateValues = weightData
        .filter((d) => d.weight != null)
        .map((d) => d.date);

      setWeightTimeBtN(
        new Date(dateValues[dateValues.length - 1]).getTime() -
          new Date(dateValues[0]).getTime()
      );

      if (timeSelection === "1 month") {
        setTickMultiplier(6);
      } else if (timeSelection === "2 months") {
        setTickMultiplier(12);
      } else if (timeSelection === "3 months") {
        setTickMultiplier(18);
      } else if (timeSelection === "6 months") {
        setTickMultiplier(36);
      } else if (timeSelection === "1 year") {
        setTickMultiplier(72);
      } else if (timeSelection === "All") {
        setTickMultiplier(Math.ceil(weightTimeBtN / 432000000));
      }

      const graphWidth = 500;
      const graphHeight = 400;
      const marginTop = 20;
      const marginRight = 20;
      const marginBottom = 20;
      const marginLeft = 30;

      const minValue = d3.min(weightValues);
      const maxValue = d3.max(weightValues);
      const meanValue = d3.mean(weightValues);
      const padding = meanValue * 0.025;

      const yScale = d3
        .scaleLinear()
        .domain([minValue - padding, maxValue + padding])
        .nice()
        .range([graphHeight - marginBottom, marginTop]);

      const svg = d3
        .select(".weightGraph")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight)
        .attr("viewBox", `0 0 ${graphWidth} ${graphHeight}`);

      const tickValues = [];
      const endDate = moment(
        weightData[weightData.length - 1].date,
        "YYYY-MM-DD"
      );

      for (let i = 0; i < 6; i++) {
        const date = moment(endDate).subtract(tickMultiplier * i, "days");
        tickValues.push(date.toDate());
      }

      const xScale = d3
        .scaleTime()
        .domain([
          new Date(tickValues[tickValues.length - 1]),
          new Date(tickValues[0]),
        ])
        .range([marginLeft, graphWidth - marginRight]);

      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${graphHeight - marginBottom})`)
        .call(
          d3
            .axisBottom(xScale)
            .tickValues(tickValues)
            .tickFormat((date) => {
              // const timeFormat = d3.timeFormat("%m/%d");
              return date.toLocaleDateString().slice(0, -5);
            })
        );

      const line = d3
        .line()
        .defined((d) => {
          return d.weight != null;
        })
        .x((d) => xScale(new Date(d.date)))
        .y((d) => yScale(d.weight));

      svg
        .append("defs")
        .append("clipPath")
        .attr("id", "clip-path")
        .append("rect")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .attr("width", graphWidth)
        .attr("height", graphHeight);

      svg
        .append("path")
        .datum(
          weightData.filter((d) => {
            return d.weight != null;
          })
        )
        .attr("fill", "none")
        .attr("stroke", "#ACEDFF")
        .attr("stroke-width", 3)
        .attr("width", graphWidth)
        .attr("d", line)
        .attr("clip-path", "url(#clip-path)");

      svg
        .append("path")
        .datum(weightData)
        .attr("fill", "none")
        .attr("stroke", "#ACEDFF")
        .attr("stroke-width", 3)
        .attr("width", graphWidth)
        .attr("stroke-linecap", "round")
        .attr("d", line)
        .attr("clip-path", "url(#clip-path)");

      if (
        userProfile &&
        userProfile.target_weight &&
        userProfile.target_weight >= minValue - padding &&
        userProfile.target_weight <= maxValue + padding
      ) {
        if (userProfile.measurement_type !== "metric") {
          svg
            .append("line")
            .attr("class", "target-line")
            .attr("x1", marginLeft)
            .attr("y1", yScale(userProfile.target_weight))
            .attr("x2", graphWidth - marginRight)
            .attr("y2", yScale(userProfile.target_weight))
            .attr("stroke", "rgb(138, 201, 38)")
            .attr("stroke-width", 2);
        } else {
          svg
            .append("line")
            .attr("class", "target-line")
            .attr("x1", marginLeft)
            .attr("y1", yScale(defaultConvertWeight(userProfile.target_weight)))
            .attr("x2", graphWidth - marginRight)
            .attr("y2", yScale(defaultConvertWeight(userProfile.target_weight)))
            .attr("stroke", "rgb(138, 201, 38)")
            .attr("stroke-width", 2);
        }
      }

      const yAxisGroup = svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .call(d3.axisLeft(yScale));

      yAxisGroup
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "end")
        .text("Y-Axis Label");

      yAxisGroup
        .selectAll("g.tick")
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", graphWidth - marginRight - marginLeft)
        .attr("y2", 0)
        .attr("stroke", "rgba(156, 165, 174, .4");

      svg.selectAll(".domain").remove();
      svg.selectAll(".x-axis .tick line").remove();
      svg.selectAll(".y-axis .tick line:first-child").remove();
      svg.selectAll("text").style("font-size", "12px");
    }
  }, [
    weightData,
    weightTimeBtN,
    tickMultiplier,
    timeSelection,
    userProfile,
    defaultConvertWeight,
  ]);

  const handleOnDragEnd = (result, routineExerciseList) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceIndex = source.index;
    const destinationIndex = destination.index;

    let sortOrder = routineExerciseList.map((exercise) => exercise.sort_order);

    const [exerciseMoved] = routineExerciseList.splice(sourceIndex, 1);
    routineExerciseList.splice(destinationIndex, 0, exerciseMoved);

    routineExerciseList.forEach((exercise, index) => {
      exercise.sort_order = sortOrder[index];
    });

    Promise.all(
      routineExerciseList.map((exercise, index) => {
        return Axios.put(`${apiURL}/api/update/exercise/${exercise.id}`, {
          name: exercise.name,
          repsLow: exercise.reps_low,
          repsHigh: exercise.reps_high,
          sets: exercise.sets,
          weight: exercise.weight,
          tracked: exercise.tracked,
          bw: exercise.bw,
          notes: exercise.notes,
          sortOrder: sortOrder[index],
        });
      })
    ).catch((error) => {
      console.log(error);
    });

    setSelectedExercise(routineExerciseList[destinationIndex]);
  };

  return (
    <div className="App">
      <div className="row flex">
        <div className="weight container">
          <div className="dashboard flex title">
            <h2>Weight</h2>
            <h1
              id="plus"
              onClick={() => {
                toggleModal("weight", true);
              }}
            >
              +
            </h1>
          </div>
          {weightData.length > 0 ? (
            <div>
              <div className="time-selection-container">
                <select
                  id="time-selection"
                  name="timeSelection"
                  value={timeSelection}
                  onChange={(e) => {
                    setTimeSelection(e.target.value);
                  }}
                >
                  <option value="1 month">1 month</option>
                  {weightTimeBtN >= 5184000000 ? (
                    <option value="2 months">2 months</option>
                  ) : (
                    ""
                  )}
                  {weightTimeBtN >= 7776000000 ? (
                    <option value="3 months">3 months</option>
                  ) : (
                    ""
                  )}
                  {weightTimeBtN >= 15552000000 ? (
                    <option value="6 months">6 months</option>
                  ) : (
                    ""
                  )}
                  {weightTimeBtN >= 31104000000 ? (
                    <option value="1 year">1 year</option>
                  ) : (
                    ""
                  )}
                  {weightTimeBtN >= 3110400000 ? (
                    <option value="All">All</option>
                  ) : (
                    ""
                  )}
                </select>
              </div>

              <div className="weight-change-container">
                <div className="weight-change dashboard flex">
                  <div>
                    <p>
                      {weightData[0].weight}{" "}
                      {userProfile && userProfile.measurement_type !== "metric"
                        ? "lbs"
                        : "kgs"}
                    </p>
                    <p id="weight-change">Start</p>
                  </div>
                  <div>
                    <p>
                      {weightData[weightData.length - 1].weight}{" "}
                      {userProfile && userProfile.measurement_type !== "metric"
                        ? "lbs"
                        : "kgs"}
                    </p>
                    <p id="weight-change">Now</p>
                  </div>
                  <div>
                    <div className="flex">
                      {weightData[weightData.length - 1].weight -
                        weightData[0].weight >
                      0 ? (
                        <p id="positive">&#8657;</p>
                      ) : weightData[weightData.length - 1].weight -
                          weightData[0].weight <
                        0 ? (
                        <p id="negative">&#8659;</p>
                      ) : (
                        ""
                      )}
                      <p>
                        {Math.abs(
                          weightData[weightData.length - 1].weight -
                            weightData[0].weight
                        ).toFixed(1)}{" "}
                        {userProfile &&
                        userProfile.measurement_type !== "metric"
                          ? "lbs"
                          : "kgs"}
                      </p>
                    </div>
                    <p id="weight-change">Change</p>
                  </div>
                </div>
              </div>
              <div className="weightGraph"></div>
              <div className="weight-list">
                <ul>
                  {weightData
                    .slice()
                    .reverse()
                    .map((val) => {
                      if (val.weight) {
                        return (
                          <div
                            className="dashboard flex"
                            key={`${val.weight} | ${val.date}`}
                          >
                            {userProfile &&
                            userProfile.measurement_type !== "metric" ? (
                              <li>{val.weight} lbs</li>
                            ) : (
                              <li>{val.weight} kgs</li>
                            )}
                            <li id="dates">
                              {parseInt(val.date.slice(5, 7))}/
                              {parseInt(val.date.slice(8, 10))}/
                              {val.date.slice(2, 4)}
                            </li>
                          </div>
                        );
                      }
                      return null;
                    })}
                </ul>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="routine container">
          <div className="dashboard flex title">
            <h2>Workout Routines</h2>
            <h2
              id="plus"
              onClick={() => {
                toggleModal("routine", true);
              }}
            >
              +
            </h2>
          </div>
          <ul className="unordered-list">
            {routines.map((routine) => {
              const isMenuOpen = openMenus[routine.id] || false;
              const exerciseList = routineExercises[routine.id] || [];

              return (
                <li key={`${routine.name}-routine`}>
                  <div className="dashboard flex list-title-card">
                    <div
                      className="flex workout-list-clickable"
                      onClick={() => {
                        toggleMenu(routine.id);
                      }}
                    >
                      <h3>{routine.name}</h3>
                      <img
                        src={process.env.PUBLIC_URL + "/rombus.png"}
                        className="rombus"
                        alt="click for drop down menu"
                      />
                    </div>
                    <div className="flex">
                      <img
                        className="img edit"
                        src={process.env.PUBLIC_URL + "/edit.png"}
                        onClick={() => {
                          setSelectedRoutine(routine);
                          toggleModal("updateRoutine", true);
                        }}
                        alt="edit"
                      />
                      <img
                        className="img delete"
                        src={process.env.PUBLIC_URL + "/delete.png"}
                        onClick={() => {
                          setSelectedRoutine(routine);
                          toggleModal("deleteRoutine", true);
                        }}
                        alt="delete"
                      />
                    </div>
                  </div>
                  {isMenuOpen && (
                    <div className="dropdown-menu">
                      <DragDropContext
                        onDragEnd={(result) =>
                          handleOnDragEnd(result, exerciseList)
                        }
                      >
                        <Droppable droppableId="exercises">
                          {(provided) => (
                            <ul
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {exerciseList.map((exercise, index) => (
                                <Draggable
                                  key={exercise.id}
                                  draggableId={`exercise-id-${exercise.id}`}
                                  index={index}
                                >
                                  {(provided) => {
                                    return (
                                      <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="dashboard flex"
                                        style={{
                                          ...provided.draggableProps.style,
                                          cursor: "default",
                                        }}
                                      >
                                        <div className="exercise-container">
                                          {exercise.name} | {exercise.sets} x{" "}
                                          {exercise.reps_low}
                                          {exercise.reps_high
                                            ? `-${exercise.reps_high}`
                                            : ""}
                                          {exercise.weight &&
                                          userProfile.measurement_type ===
                                            "imperial"
                                            ? ` | ${exercise.weight} lbs`
                                            : exercise.weight &&
                                              userProfile.measurement_type ===
                                                "metric"
                                            ? ` | ${defaultConvertWeight(
                                                exercise.weight
                                              )} kgs`
                                            : ""}
                                          {exercise.notes && (
                                            <img
                                              className="img notes"
                                              src={
                                                process.env.PUBLIC_URL +
                                                "/notes.png"
                                              }
                                              onClick={() => {
                                                setSelectedExercise(exercise);
                                                toggleModal("notes", true);
                                              }}
                                              alt="notes"
                                            />
                                          )}
                                        </div>
                                        <div className="flex">
                                          <img
                                            className="img edit"
                                            src={
                                              process.env.PUBLIC_URL +
                                              "/edit.png"
                                            }
                                            onClick={() => {
                                              setSelectedRoutine(routine);
                                              setSelectedExercise(exercise);
                                              toggleModal(
                                                "updateExercise",
                                                true
                                              );
                                            }}
                                            alt="edit"
                                          />
                                          <img
                                            className="img x"
                                            src={
                                              process.env.PUBLIC_URL + "/x.png"
                                            }
                                            onClick={() => {
                                              setSelectedRoutine(routine);
                                              setSelectedExercise(exercise);
                                              toggleModal(
                                                "deleteExercise",
                                                true
                                              );
                                            }}
                                            alt="delete"
                                          />
                                          <img
                                            className="img sort"
                                            src={
                                              process.env.PUBLIC_URL +
                                              "/sort.png"
                                            }
                                            onClick={() => {
                                              setSelectedRoutine(routine);
                                              setSelectedExercise(exercise);
                                            }}
                                            alt="sort"
                                          />
                                        </div>
                                      </li>
                                    );
                                  }}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ul>
                          )}
                        </Droppable>
                      </DragDropContext>
                      <div className="plus-container">
                        <h1
                          id="list-plus"
                          onClick={() => {
                            setSelectedRoutine(routine);
                            toggleModal("exercise", true);
                          }}
                        >
                          +
                        </h1>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="tracked container">
          <div className="dashboard flex title">
            <h2>Track Progress</h2>
            <img
              className="question-mark"
              src={process.env.PUBLIC_URL + "/question-mark.png"}
              onClick={() => {
                toggleModal("instructions", true);
              }}
              alt="instuctions"
            />
          </div>
          <div>
            {Object.keys(trackedExercises).map((exerciseName) => (
              <div key={exerciseName}>
                <div className="dashboard flex list-title-card">
                  <div
                    className="flex tracked-clickable"
                    onClick={() => {
                      toggleTrackedMenu(exerciseName);
                    }}
                  >
                    <h3>{exerciseName}</h3>
                    <img
                      src={process.env.PUBLIC_URL + "/rombus.png"}
                      className="rombus"
                      alt="click for drop down menu"
                    />
                  </div>
                </div>
                {openMenus[exerciseName] && (
                  <div className="tracked-dropdown dropdown-menu">
                    <ul>
                      {trackedExercises[exerciseName]
                        .slice()
                        .reverse()
                        .map((exercise) => (
                          <li key={exercise.id} className="dashboard flex">
                            <div className="exercise-container">
                              {`${new Date(exercise.date).toLocaleDateString()}
                                `}
                              :{" "}
                              {exercise.weight &&
                              userProfile.measurement_type === "imperial"
                                ? `${exercise.weight} lbs | `
                                : exercise.weight &&
                                  userProfile.measurement_type === "metric"
                                ? `${defaultConvertWeight(
                                    exercise.weight
                                  )} kgs | `
                                : " "}
                              {exercise.bw
                                ? `(${compareBW(
                                    userProfile.weight,
                                    exercise.weight
                                  )}xBW) | `
                                : " "}
                              {exercise.sets} x {exercise.reps_low}
                              {exercise.reps_high
                                ? `-${exercise.reps_high}`
                                : ""}
                              {exercise.weight ? (
                                <img
                                  alt="exercise statistics"
                                  className="img stats"
                                  src={
                                    process.env.PUBLIC_URL + "/statistics.png"
                                  }
                                  onClick={() => {
                                    setSelectedExercise(exercise);
                                    setFirstExercise(
                                      trackedExercises[exerciseName].find(
                                        (entry) => entry.weight > 0
                                      )
                                    );
                                    toggleModal("exerciseStatistics", true);
                                  }}
                                />
                              ) : null}
                            </div>
                            <img
                              className="img x"
                              src={process.env.PUBLIC_URL + "/x.png"}
                              onClick={() => {
                                setSelectedExercise(exercise);
                                toggleModal("deleteTrackedExercise", true);
                              }}
                              alt="delete"
                            />
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showWeightModal && (
        <WeightFormModal
          loginStatus={loginStatus}
          userProfile={userProfile}
          onClose={() => {
            toggleModal("weight", false);
          }}
          previousWeight={previousWeight}
          setPreviousWeight={setPreviousWeight}
          formattedDate={formattedDate}
          setWeightData={setWeightData}
          weightData={weightData}
          setUserProfile={setUserProfile}
          convertWeight={convertWeight}
          defaultConvertWeight={defaultConvertWeight}
          safeParseFloat={safeParseFloat}
          apiURL={apiURL}
        />
      )}

      {showRoutineModal && (
        <RoutineFormModal
          loginStatus={loginStatus}
          onClose={() => {
            toggleModal("routine", false);
          }}
          routines={routines}
          setRoutines={setRoutines}
          apiURL={apiURL}
        />
      )}

      {showUpdateRoutineModal && (
        <UpdateRoutineModal
          onClose={() => {
            setSelectedRoutine(null);
            toggleModal("updateRoutine", false);
          }}
          routines={routines}
          setRoutines={setRoutines}
          selectedRoutine={selectedRoutine}
          apiURL={apiURL}
        />
      )}

      {showDeleteRoutineModal && (
        <DeleteRoutineModal
          onClose={() => {
            setSelectedRoutine(null);
            toggleModal("deleteRoutine", false);
          }}
          setRoutines={setRoutines}
          routines={routines}
          selectedRoutine={selectedRoutine}
          apiURL={apiURL}
        />
      )}

      {showExerciseModal && (
        <ExerciseFormModal
          loginStatus={loginStatus}
          userProfile={userProfile}
          onClose={() => {
            setSelectedRoutine(null);
            toggleModal("exercise", false);
          }}
          selectedRoutine={selectedRoutine}
          routineExercises={routineExercises}
          setRoutineExercises={setRoutineExercises}
          formattedDate={formattedDate}
          setTrackedExercises={setTrackedExercises}
          convertWeight={convertWeight}
          defaultConvertWeight={defaultConvertWeight}
          safeParseFloat={safeParseFloat}
          apiURL={apiURL}
        />
      )}

      {showUpdateExerciseModal && selectedExercise && (
        <UpdateExerciseModal
          loginStatus={loginStatus}
          userProfile={userProfile}
          onClose={() => {
            setSelectedRoutine(null);
            toggleModal("updateExercise", false);
          }}
          selectedRoutine={selectedRoutine}
          selectedExercise={selectedExercise}
          setRoutineExercises={setRoutineExercises}
          formattedDate={formattedDate}
          setTrackedExercises={setTrackedExercises}
          convertWeight={convertWeight}
          defaultConvertWeight={defaultConvertWeight}
          safeParseFloat={safeParseFloat}
          apiURL={apiURL}
        />
      )}

      {showDeleteExerciseModal && selectedExercise && (
        <DeleteExerciseModal
          onClose={() => {
            setSelectedRoutine(null);
            toggleModal("deleteExercise", false);
          }}
          selectedExercise={selectedExercise}
          selectedRoutine={selectedRoutine}
          setRoutineExercises={setRoutineExercises}
          apiURL={apiURL}
        />
      )}

      {showDeleteTrackedExerciseModal && selectedExercise && (
        <DeleteTrackedExerciseModal
          onClose={() => {
            toggleModal("deleteTrackedExercise", false);
          }}
          selectedExercise={selectedExercise}
          setTrackedExercises={setTrackedExercises}
          apiURL={apiURL}
        />
      )}

      {showNotesModal && selectedExercise && (
        <NotesModal
          onClose={() => {
            toggleModal("notes", false);
          }}
          selectedExercise={selectedExercise}
        />
      )}

      {showInstructionsModal && (
        <InstructionsModal
          onClose={() => {
            toggleModal("instructions", false);
          }}
        />
      )}

      {showStatisticsModal && (
        <StatisticsModal
          onClose={() => {
            toggleModal("exerciseStatistics", false);
          }}
          selectedExercise={selectedExercise}
          firstExercise={firstExercise}
          userProfile={userProfile}
          defaultConvertWeight={defaultConvertWeight}
        />
      )}
    </div>
  );
};

export default Dashboard;
