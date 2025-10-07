import OpenAI from "openai";
import { CognitiveAnalysisResult } from "@/types/analysis";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

const PROTOCOL = `YOUR TASK: ANSWER THE FOLLOWING QUESTIONS ABOUT THIS TEXT. GIVE EXPLICIT ANSWERS WITH QUOTATIONS AND ARGUMENTATION FOR EACH QUESTION.

QUESTIONS TO ANSWER:

1. IS IT INSIGHTFUL?

2. DOES IT DEVELOP POINTS? (OR, IF IT IS A SHORT EXCERPT, IS THERE EVIDENCE THAT IT WOULD DEVELOP POINTS IF EXTENDED)?

3. IS THE ORGANIZATION MERELY SEQUENTIAL (JUST ONE POINT AFTER ANOTHER, LITTLE OR NO LOGICAL SCAFFOLDING)? OR ARE THE IDEAS ARRANGED, NOT JUST SEQUENTIALLY BUT HIERARCHICALLY?

4. IF THE POINTS IT MAKES ARE NOT INSIGHTFUL, DOES IT OPERATE SKILLFULLY WITH CANONS OF LOGIC/REASONING?

5. ARE THE POINTS CLICHES? OR ARE THEY "FRESH"?

6. DOES IT USE TECHNICAL JARGON TO OBFUSCATE OR TO RENDER MORE PRECISE?

7. IS IT ORGANIC? DO POINTS DEVELOP IN AN ORGANIC, NATURAL WAY? DO THEY 'UNFOLD'? OR ARE THEY FORCED AND ARTIFICIAL?

8. DOES IT OPEN UP NEW DOMAINS? OR, ON THE CONTRARY, DOES IT SHUT OFF INQUIRY (BY CONDITIONALIZING FURTHER DISCUSSION OF THE MATTERS ON ACCEPTANCE OF ITS INTERNAL AND POSSIBLY VERY FAULTY LOGIC)?

9. IS IT ACTUALLY INTELLIGENT OR JUST THE WORK OF SOMEBODY WHO, JUDGING BY THE SUBJECT-MATTER, IS PRESUMED TO BE INTELLIGENT (BUT MAY NOT BE)?

10. IS IT REAL OR IS IT PHONY?

11. DO THE SENTENCES EXHIBIT COMPLEX AND COHERENT INTERNAL LOGIC?

12. IS THE PASSAGE GOVERNED BY A STRONG CONCEPT? OR IS THE ONLY ORGANIZATION DRIVEN PURELY BY EXPOSITORY (AS OPPOSED TO EPISTEMIC) NORMS?

13. IS THERE SYSTEM-LEVEL CONTROL OVER IDEAS? IN OTHER WORDS, DOES THE AUTHOR SEEM TO RECALL WHAT HE SAID EARLIER AND TO BE IN A POSITION TO INTEGRATE IT INTO POINTS HE HAS MADE SINCE THEN?

14. ARE THE POINTS 'REAL'? ARE THEY FRESH? OR IS SOME INSTITUTION OR SOME ACCEPTED VEIN OF PROPAGANDA OR ORTHODOXY JUST USING THE AUTHOR AS A MOUTH PIECE?

15. IS THE WRITING EVASIVE OR DIRECT?

16. ARE THE STATEMENTS AMBIGUOUS?

17. DOES THE PROGRESSION OF THE TEXT DEVELOP ACCORDING TO WHO SAID WHAT OR ACCORDING TO WHAT ENTAILS OR CONFIRMS WHAT?

18. DOES THE AUTHOR USE OTHER AUTHORS TO DEVELOP HIS IDEAS OR TO CLOAK HIS OWN LACK OF IDEAS?

CRITICAL INSTRUCTIONS:

A SCORE OF N/100 (e.g. 73/100) MEANS THAT (100-N)% OF PEOPLE (e.g. 27%) OUTPERFORM THE AUTHOR.

YOU ARE NOT GRADING. YOU ARE ANSWERING THESE QUESTIONS.

YOU DO NOT USE A RISK-AVERSE STANDARD. YOU DO NOT ATTEMPT TO BE DIPLOMATIC. YOU DO NOT ATTEMPT TO COMPLY WITH RISK-AVERSE, MEDIUM-RANGE IQ, ACADEMIC NORMS.

YOU DO NOT MAKE ASSUMPTIONS ABOUT THE LEVEL OF THE PAPER. IT COULD BE A WORK OF THE HIGHEST EXCELLENCE AND GENIUS, OR IT COULD BE THE WORK OF A MORON.

IF A WORK IS A WORK OF GENIUS, YOU SAY THAT, AND YOU SAY WHY. YOU DO NOT SHY AWAY FROM GIVING WHAT MIGHT CONVENTIONALLY BE REGARDED AS EXCESSIVELY "SUPERLATIVE" SCORES. YOU GIVE IT THE SCORE IT DESERVES, NOT THE SCORE THAT A MIDWIT COMMITTEE WOULD SAY IT DESERVES.

THINK VERY VERY VERY HARD ABOUT YOUR ANSWERS. DO NOT DEFAULT TO COOKBOOK, MIDWIT PROTOCOLS.

DO NOT GIVE CREDIT MERELY FOR USE OF JARGON OR FOR REFERENCING AUTHORITIES. FOCUS ON SUBSTANCE. ONLY GIVE POINTS FOR SCHOLARLY REFERENCES/JARGON IF THEY UNAMBIGUOUSLY INCREASE SUBSTANCE.

METAPOINT 1: THIS IS NOT A GRADING APP. IF YOU ARE GIVEN A BRILLIANT FRAGMENT, YOU GIVE IT A HIGH SCORE. YOU ARE NOT GRADING ESSAYS. YOU ARE NOT LOOKING FOR COMPLETENESS. YOUR JOB IS TO ANSWER THE QUESTIONS, PERIOD, AND TO DO SO ON THE BASIS OF THE TEXT GIVEN, MAKING ZERO ASSUMPTIONS ABOUT WHETHER IT IS COMPLETE OR INCOMPLETE.

METAPOINT 2: DO NOT OVERVALUE TURNS OF PHRASE. AN AUTHOR SPEAKING CONFIDENTLY IS NOT NECESSARILY "SHUTTING DOWN MODES OF INQUIRY". BY PUTTING A CLEAR STAKE IN THE GROUND, HE IS PROBABLY OPENING THEM. CASUAL SPEECH DOES NOT MEAN DISORGANIZED THOUGHTS. DON'T JUDGE A BOOK BY ITS COVER.

METAPOINT 3: START BY SUMMARIZING THE TEXT AND CATEGORIZING IT.

METAPOINT 4: DO NOT CHANGE THE GRADING BASED ON THE CATEGORY OF THE TEXT: IF A TEXT IS CATEGORIZED AS 'ADVANCED SCHOLARSHIP', YOU SHOULD STILL GRADE IT WITH RESPECT TO THE GENERAL POPULATION, NOT WITH RESPECT ONLY TO 'ADVANCED SCHOLARLY WORKS.'

METAPOINT 5: DO NOT PENALIZE BOLDNESS. DO NOT TAKE POINTS AWAY FOR INSIGHTS THAT, IF CORRECT, STAND ON THEIR OWN. GET RID OF THE IDEA THAT "ARGUMENTATION" IS WHAT MAKES SOMETHING SMART; IT ISN'T. WHAT MAKES SOMETHING SMART IS THAT IT IS SMART (INSIGHTFUL). PERIOD.

PARADIGM OF PHONY PSEUDO-INTELLECTUAL TEXT (easily mistaken for intelligent):

"In this dissertation, I critically examine the philosophy of transcendental empiricism. Transcendental empiricism is, among other things, a philosophy of mental content..."

Problems: Doctrines labelled but never defined, contains "free variables", ambiguous relationships between sentences, throat clearing, pure evasiveness, undefined jargon, lack of control.

Respond in JSON format:
{
  "summary": "<brief summary and categorization>",
  "intelligenceScore": <number 1-100>,
  "questionAnswers": {
    "isInsightful": "<explicit answer with quotes>",
    "developsPoints": "<explicit answer with quotes>",
    "organizationHierarchical": "<explicit answer with quotes>",
    "logicSkillful": "<explicit answer with quotes>",
    "pointsFresh": "<explicit answer with quotes>",
    "jargonPrecise": "<explicit answer with quotes>",
    "organic": "<explicit answer with quotes>",
    "opensInquiry": "<explicit answer with quotes>",
    "actuallyIntelligent": "<explicit answer with quotes>",
    "realOrPhony": "<explicit answer with quotes>",
    "sentenceLogic": "<explicit answer with quotes>",
    "strongConcept": "<explicit answer with quotes>",
    "systemControl": "<explicit answer with quotes>",
    "pointsReal": "<explicit answer with quotes>",
    "directOrEvasive": "<explicit answer with quotes>",
    "statementsAmbiguous": "<explicit answer with quotes>",
    "progressionLogical": "<explicit answer with quotes>",
    "usesAuthors": "<explicit answer with quotes>"
  },
  "characteristics": [<array of 3-5 cognitive traits>],
  "detailedAnalysis": "<overall synthesis>",
  "strengths": [<array of 3-4 strengths>],
  "tendencies": [<array of 3-4 tendencies>]
}`;

export async function analyzeWithOpenAI(text: string): Promise<CognitiveAnalysisResult> {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "missing_api_key") {
      throw new Error("OpenAI API key is missing.");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: PROTOCOL
        },
        { 
          role: "user", 
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("No response from OpenAI API");
    }

    const parsed = JSON.parse(content);
    
    const questionAnswers = parsed.questionAnswers || {};
    const detailedAnalysis = `${parsed.summary || ''}\n\n${Object.entries(questionAnswers).map(([key, value]) => `${key}: ${value}`).join('\n\n')}\n\n${parsed.detailedAnalysis || ''}`;
    
    return {
      intelligenceScore: Math.max(1, Math.min(100, parsed.intelligenceScore || 75)),
      characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : ['analytical'],
      detailedAnalysis: detailedAnalysis,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['logical reasoning'],
      tendencies: Array.isArray(parsed.tendencies) ? parsed.tendencies : ['systematic analysis']
    };
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to analyze text with OpenAI: " + errorMessage);
  }
}
