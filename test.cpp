#include<iostream>
#include<vector>
#include<climits>

using namespace std;
class map{
private:
    // 邻接矩阵
    vector<vector<int>> matrix;
    // 城市数量
    int n;
public:
    // 构造函数
    map(){};
    // 带参数的构造函数
    map(int nums):n(nums),matrix(nums,vector<int>(nums,INT_MAX)){};
    // 添加边
    void addEdge(int u,int v,int w){
        matrix[u][v] = w;
        matrix[v][u] = w;
        return;
    }
    // Dijkstra算法
    void dijkstra(const vector<int>& teams,int c1,int c2){
        //各个城市到c1的最短距离
        vector<int> dist(n,INT_MAX);
        //到c1的最短路径为0
        dist[c1] = 0;
    
        //是否确定为距离c1最近的城市
        vector<bool> isvisited(n,false);

        //到某城市的最短路径的条数
        vector<int> minpaths(n,0);
        //到c1的最短路径的条数为1
        minpaths[c1] = 1;

        //到某城市的最大救援队数量
        vector<int> maxteams(n,0);
        //到c1的最大救援队数量为c1的救援队数量
        maxteams[c1] = teams[c1];
        
        
        for(int i=0;i<n;i++){
            int minindex = -1;// 当前最小距离城市的索引
            int mindist = INT_MAX;// 当前最小距离
            // 找到当前未确定最短路径的城市中距离c1最近的城市
            for(int j=0;j<n;j++){
                // 如果j城市未被访问且距离c1的距离小于当前最小距离
                if(dist[j] < mindist && !isvisited[j]){
                    mindist = dist[j];
                    minindex = j;
                }
            }
            // 如果所有城市都已确定最短路径
            if(minindex == -1){
                break;
            }
            // 如果找到当前最小距离城市
            else{
                // 确定minindex为距离c1最近的城市
                isvisited[minindex] = true;
                // 更新与minindex相邻的城市的最短路径
                for(int v=0;v<n;v++){
                    // 如果minindex到v的边存在
                    if(matrix[minindex][v] < INT_MAX){
                        // 如果通过minindex到达v的距离小于当前已知距离
                        if(dist[v] > dist[minindex] + matrix[minindex][v]){
                            // 更新到v的最短距离
                            dist[v] = dist[minindex] + matrix[minindex][v];
                            // 更新到v的最短路径的条数
                            minpaths[v] = minpaths[minindex];
                            // 更新到v的最大救援队数量
                            maxteams[v] = maxteams[minindex] + teams[v];
                        }
                        // 如果通过minindex到达v的距离等于当前已知距离
                        else if(dist[v] == dist[minindex] + matrix[minindex][v]){
                            // 更新到v的最短路径的条数
                            minpaths[v] += minpaths[minindex];
                            // 更新到v的最大救援队数量
                            maxteams[v] = max(maxteams[v],maxteams[minindex] + teams[v]);
                        }
                        else{
                            continue;
                        }
                    }
                }
            }
        }
        cout << minpaths[c2] << " " << maxteams[c2] << endl;
    }
};
int main(){
    int n,m,c1,c2;
    cin >> n >> m >> c1 >> c2;
    
    map mp = map(n);
    
    //每个城市中救援队的数量
    vector<int> teams(n,0);
    for(int i=0;i<n;i++){
        cin >> teams[i];
    }
    
    //初始化邻接表
    for(int i=0;i<m;i++){
        int u,v,w;
        cin >> u >> v >> w;
        mp.addEdge(u,v,w);
    }

    mp.dijkstra(teams,c1,c2);
    return 0;
}