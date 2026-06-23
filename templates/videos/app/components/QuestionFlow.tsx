import {
  GuidedQuestionFlow,
  type GuidedQuestion,
} from "@agent-native/core/client";
import { useI18n } from "@agent-native/i18n";
import type { QuestionFlowQuestion } from "@shared/api";

interface QuestionFlowProps {
  questions: QuestionFlowQuestion[];
  onSubmit: (answers: Record<string, any>) => void;
  onSkip: () => void;
  title?: string;
  description?: string;
  skipLabel?: string;
  submitLabel?: string;
}

export function QuestionFlow({
  questions,
  onSubmit,
  onSkip,
  title,
  description,
  skipLabel,
  submitLabel,
}: QuestionFlowProps) {
  const { t } = useI18n();
  return (
    <GuidedQuestionFlow
      questions={questions as GuidedQuestion[]}
      onSubmit={onSubmit}
      onSkip={onSkip}
      title={title ?? t("questionFlow.tuneTitle")}
      description={
        description ??
        t("questionFlow.tuneDesc")
      }
      skipLabel={skipLabel ?? t("questionFlow.skip")}
      submitLabel={submitLabel ?? t("questionFlow.create")}
    />
  );
}
