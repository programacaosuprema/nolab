const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },

    commands: [
      {
        type: { type: String },
        value: mongoose.Schema.Types.Mixed,
      },
    ],

    output: {
      type: [Number],
      default: [],
    },

    passed: {
      type: Boolean,
      default: false,
    },

    feedback: {
      type: String,
    },
  },
  { timestamps: true },
);
