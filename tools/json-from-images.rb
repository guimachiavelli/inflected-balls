require 'json'

def main
    entries = Dir.entries('public/imgs').select do |img|
        File.extname(img) == '.jpg'
    end

    entries = entries.map do |img|
        "imgs/#{img}"
    end

    File.write('public/imgs.json', JSON.generate(entries))
end

main()
