import { useState } from "react";
import "blockly/javascript";
import { runStack } from "../simulator/engines/stackEngine";
import { runQueue } from "../simulator/engines/queueEngine";
import { runList } from "../simulator/engines/listEngine";

export default function useSimulation({structure}) {
  const engines = {
    stack: runStack,
    queue: runQueue,
    list: runList
  };

  const runEngine = engines[structure];
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  function handleRun(code) {
    if (!code) {
       throw new Error("Nenhum código para executar");
    }
    try {
      const result = runEngine(code);
      
      if (!Array.isArray(result)) {
        throw new Error("Resultado inválido");
      }

      setSteps(result);
      setCurrentStep(0);
      setIsRunning(true);
      setIsPaused(false);
    } catch (err) {
      throw new Error("Erro ao executar o algoritmo", err);
    }
  }

   function handlePause() {
    setIsRunning(false);
    setIsPaused(true);
  }

  function handleNextStep() {
    setCurrentStep((prev) =>
      prev < steps.length - 1 ? prev + 1 : prev
    );
  }

  function handleClear() {
    setSteps([]);
    setCurrentStep(0);
    setIsRunning(false);
    setIsPaused(false);
  }

  function handleContinue() {
    setIsRunning(true);
    setIsPaused(false);
  }

  function stepAuto(direction = 1) {
    setCurrentStep((prev) => {
      if (direction > 0) {
        return Math.min(prev + 1, steps.length - 1);
      } else {
        return Math.max(prev - 1, 0);
      }
    });
  }

  function start() {
    setIsRunning(true);
    setIsPaused(false);
  }

  function stop() {
    setIsRunning(false);
    setIsPaused(false);
  }

  return {
    steps,
    currentStep,
    stepAuto,
    isRunning,
    start,
    stop,
    isPaused,
    handleRun,
    handlePause,
    handleContinue,
    handleNextStep,
    handleClear
  };
}