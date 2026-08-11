import type {
  HrEngineRequestV2,
  HrEngineResultV2,
  ConfidenceLabel,
  DataQualityLabel,
  SlateValidationResult,
} from "./types";
import { calculatePCQI } from "./components/pcqi";
import { calculateZFAS } from "./components/zfas";
import { calculatePVM } from "./components/pvm";
import { calculateEPV } from "./components/epv";
import { calculateOVS } from "./components/ovs";
import { validateSlate } from "./validation/validateSlate";
import { runHrModel } from "./model/logit";
import { HR_MODEL_METADATA_V2 } from "./model/weights";

function deriveConfidence(dataQuality: DataQualityLabel, validation: SlateValidationResult): ConfidenceLabel | null {
  if (dataQuality === "INVALID") return null;
  if (dataQuality === "LOW") return "LOW";
  if (validation.downgraded) return "MEDIUM";
  return "HIGH";
}

export function runHrProbabilityEngineV2(request: HrEngineRequestV2): HrEngineResultV2 {
  const validation = validateSlate(request);
  const ledger: string[] = [...validation.reasons];

  if (validation.dataQuality === "INVALID") {
    return {
      status: "NO ACTION",
      reason: "INVALID_INPUT_DATA",
      dataQuality: validation.dataQuality,
      confidence: null,
      components: null,
      logitHr: null,
      pRaw: null,
      pCalibrated: null,
      pModel: null,
      metadata: HR_MODEL_METADATA_V2,
      ledger,
    };
  }

  const PCQI = calculatePCQI(request.batter);
  const ZFAS = calculateZFAS(request.batter, request.pitcher);
  const PVM = calculatePVM(request.pitcher, request.bullpen);
  const EPV = calculateEPV(request.batter, request.environment);
  const OVS = calculateOVS(request.batter, request.game);

  ledger.push(...PCQI.notes, ...ZFAS.notes, ...PVM.notes, ...EPV.notes, ...OVS.notes);

  const model = runHrModel({
    PCQI: PCQI.value,
    ZFAS: ZFAS.value,
    PVM: PVM.value,
    EPV: EPV.value,
    OVS: OVS.value,
  });

  return {
    status: "SCORED",
    dataQuality: validation.dataQuality,
    confidence: deriveConfidence(validation.dataQuality, validation),
    components: { PCQI, ZFAS, PVM, EPV, OVS },
    logitHr: model.logitHr,
    pRaw: model.pRaw,
    pCalibrated: model.pCalibrated,
    pModel: model.pModel,
    metadata: HR_MODEL_METADATA_V2,
    ledger,
  };
}
