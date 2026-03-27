from flask import Flask, jsonify, request

app = Flask(__name__)

# 模拟数据库
users_profiles = {
    "1": {"name": "张三", "bio": "Node.js 爱好者", "avatar": "https://example.com/1.jpg"},
    "2": {"name": "李四", "bio": "Python 大师", "avatar": "https://example.com/2.jpg"}
}

@app.route('/api/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    print(f"Python 收到请求路径: {request.path}")
    # 模拟从“数据库”获取数据
    profile = users_profiles.get(user_id)
    
    if profile:
        return jsonify({
            "success": True,
            "data": profile,
            "message": "来自 Python 服务的问候！"
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "找不到该用户"
        }), 404

if __name__ == '__main__':
    # 运行在 5001 端口
    print("Python Profile Service 正在启动，端口 5001...")
    app.run(port=5001)