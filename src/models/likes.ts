import { Schema, model, models } from "mongoose";

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true },
);

likeSchema.index({ user: 1, post: 1 }, { unique: true });

export default models.Like || model("Like", likeSchema);
