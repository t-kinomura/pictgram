class CommentsController < ApplicationController

  def new
    # binding.pry
    @comment = Comment.new
    @topic_id = params[:topic_id]
  end

  def create
    # binding.pry
    @comment = Comment.new(comment_params)
    @comment.user_id = current_user.id
    if @comment.save
      redirect_to topics_path success: 'コメントを送信しました'
    else
      flash.now[:danger] = 'コメントを送信できませんでした'
      render :new
    end
  end

  def destroy
  end

  private
  def comment_params
    params.require(:comment).permit(:text, :topic_id)
  end
end
